const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Mentee = require('../models/Mentee');
const Quiz = require('../models/Quiz');
const QuizSubmission = require('../models/QuizSubmission');
const Resource = require('../models/Resource');
const { authenticateMentee } = require('../middleware/authMentor');
const router = express.Router();

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */
router.post('/login', async (req, res) => {
  const { enrollmentNumber, password } = req.body;
  try {
    const mentee = await Mentee.findOne({ enrollmentNumber });
    if (!mentee) return res.status(400).json({ error: 'Invalid credentials' });

    // New accounts store a bcrypt hash; legacy accounts may still hold plain text.
    const isHashed = typeof mentee.password === 'string' && mentee.password.startsWith('$2');
    const ok = isHashed ? await bcrypt.compare(password, mentee.password) : password === mentee.password;
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    // Upgrade legacy plain-text passwords on successful login
    if (!isHashed) {
      mentee.password = await bcrypt.hash(password, 10);
      await mentee.save();
    }

    const token = jwt.sign({ id: mentee._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/* Dashboard (also feeds the AI profile page)                          */
/* ------------------------------------------------------------------ */
router.get('/dashboard', authenticateMentee, async (req, res) => {
  try {
    const mentee = await Mentee.findById(req.mentee._id)
      .populate({ path: 'programs', populate: { path: 'resources', model: 'Resource' } })
      .populate({ path: 'completedResources.resource', model: 'Resource' });

    // Quiz windows live on the Quiz document, so fetch them for the quiz resources
    const quizResourceIds = [];
    mentee.programs.forEach((p) =>
      p.resources.forEach((r) => {
        if (r.type === 'quiz') quizResourceIds.push(r._id);
      })
    );
    const quizzes = await Quiz.find({ resource: { $in: quizResourceIds } }).select('resource startTime endTime questions');
    const quizByResource = new Map(quizzes.map((q) => [q.resource.toString(), q]));

    const completedMap = new Map();
    const completedResources = [];
    let totalScore = 0;

    mentee.completedResources.forEach((item) => {
      if (!item.resource) return; // resource was deleted
      totalScore += item.score || 0;
      completedMap.set(item.resource._id.toString(), item);
      completedResources.push({
        resourceId: item.resource._id,
        title: item.resource.title,
        type: item.resource.type,
        maxScore: item.resource.maxScore,
        deadline: item.resource.deadline,
        score: item.score || 0,
        completedOn: item.completedOn,
        verified: item.resource.type === 'project' ? !!item.verified : true
      });
    });

    const programs = mentee.programs.map((program) => {
      const resources = program.resources.map((r) => {
        const done = completedMap.get(r._id.toString());
        const quiz = quizByResource.get(r._id.toString());
        return {
          ...r.toObject(),
          completed: !!done,
          score: done ? done.score : null,
          completedOn: done ? done.completedOn : null,
          // projects are "submitted" first and "verified" once a mentor scores them
          verified: done ? (r.type === 'project' ? !!done.verified : true) : false,
          quizWindow: quiz ? { startTime: quiz.startTime, endTime: quiz.endTime, questionCount: quiz.questions.length } : undefined
        };
      });
      return { ...program.toObject(), resources };
    });

    res.json({
      id: mentee._id,
      name: mentee.name,
      email: mentee.email,
      enrollmentNumber: mentee.enrollmentNumber,
      interests: mentee.interests || [],
      streak: mentee.streak,
      totalScore,
      programs,
      completedResources,
      rank: await calculateRank(mentee._id)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/* Resource completion (videos only: quizzes and projects have their   */
/* own flows, otherwise anyone could tick a box for full marks)        */
/* ------------------------------------------------------------------ */
router.post('/resources/:id/complete', authenticateMentee, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    const mentee = req.mentee;
    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    if (resource.type !== 'video') {
      return res.status(400).json({ error: 'Quizzes and projects must be submitted, not ticked off' });
    }
    if (resource.isLocked) return res.status(403).json({ error: 'Resource is locked' });

    // Late submissions lose 1 point per day
    const deadline = resource.deadline;
    const isLate = deadline && new Date() > deadline;
    const latePenalty = isLate ? Math.floor((new Date() - deadline) / (1000 * 60 * 60 * 24)) : 0;
    const score = Math.max(0, resource.maxScore - latePenalty);

    const existing = mentee.completedResources.find((c) => c.resource.toString() === resource._id.toString());
    if (existing) {
      return res.json({ message: 'Already completed', score: existing.score });
    }
    mentee.completedResources.push({ resource: resource._id, score, completedOn: new Date() });

    await updateStreak(mentee);
    await mentee.save();
    res.json({ message: 'Resource marked as completed!', score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/* Quizzes                                                             */
/* ------------------------------------------------------------------ */
router.post('/resources/:id/quiz/submit', authenticateMentee, async (req, res) => {
  try {
    const resourceId = req.params.id;
    const mentee = req.mentee;
    const answers = req.body.answers || []; // [{ questionId, selectedOptionIndex }, ...]

    const resource = await Resource.findById(resourceId);
    if (!resource || resource.type !== 'quiz') return res.status(400).json({ error: 'Invalid quiz resource' });
    if (resource.isLocked) return res.status(403).json({ error: 'Quiz is locked' });

    const quiz = await Quiz.findOne({ resource: resourceId });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const now = new Date();
    if (now < quiz.startTime || now > quiz.endTime) {
      return res.status(403).json({ error: 'Quiz is not active at this time' });
    }

    const existing = await QuizSubmission.findOne({ quiz: quiz._id, mentee: mentee._id });
    if (existing) return res.status(409).json({ error: 'Quiz already submitted' });

    let totalScore = 0;
    for (const question of quiz.questions) {
      const userAnswer = answers.find((ans) => ans.questionId === question._id.toString());
      if (userAnswer && userAnswer.selectedOptionIndex === question.correctOptionIndex) {
        totalScore += question.marks || 1;
      }
    }

    await new QuizSubmission({
      quiz: quiz._id,
      resource: resourceId,
      mentee: mentee._id,
      answers,
      score: totalScore
    }).save();

    const alreadyCompleted = mentee.completedResources.find((r) => r.resource.toString() === resource._id.toString());
    if (alreadyCompleted) {
      alreadyCompleted.score = totalScore;
      alreadyCompleted.completedOn = new Date();
    } else {
      mentee.completedResources.push({ resource: resource._id, score: totalScore, completedOn: new Date() });
    }

    await updateStreak(mentee);
    await mentee.save();

    res.status(200).json({ message: 'Quiz submitted successfully!', score: totalScore, maxScore: resource.maxScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/resources/:id/quiz', authenticateMentee, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource || resource.type !== 'quiz') {
      return res.status(400).json({ error: 'Invalid resource or quiz not found' });
    }
    const quiz = await Quiz.findOne({ resource: req.params.id });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    res.json({
      title: resource.title,
      startTime: quiz.startTime,
      endTime: quiz.endTime,
      maxScore: resource.maxScore,
      questions: quiz.questions.map((q) => ({
        id: q._id,
        questionText: q.questionText,
        options: q.options,
        marks: q.marks
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */
router.post('/resources/:resourceId/project', authenticateMentee, async (req, res) => {
  try {
    const { githubLink, deployedLink, description } = req.body;
    const resource = await Resource.findById(req.params.resourceId);
    const mentee = req.mentee;

    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    if (resource.type !== 'project') return res.status(400).json({ error: 'Invalid resource type' });
    if (resource.isLocked) return res.status(403).json({ error: 'Resource is locked' });
    if (!githubLink || !deployedLink || !description) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = mentee.completedResources.find((c) => c.resource.toString() === resource._id.toString());
    if (existing) {
      if (existing.verified) return res.status(409).json({ error: 'This project has already been verified' });
      existing.githubLink = githubLink;
      existing.deployedLink = deployedLink;
      existing.description = description;
      existing.submittedOn = new Date();
      existing.score = 0;
    } else {
      mentee.completedResources.push({
        resource: resource._id,
        githubLink,
        deployedLink,
        description,
        score: 0, // set by the mentor on review
        submittedOn: new Date()
      });
    }
    await updateStreak(mentee);
    await mentee.save();

    res.json({ message: 'Project submitted! Your mentor will review it soon.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ------------------------------------------------------------------ */
/* Profile: interest tags + optional LLM summary                       */
/* ------------------------------------------------------------------ */
router.put('/interests', authenticateMentee, async (req, res) => {
  try {
    const interests = Array.isArray(req.body.interests)
      ? [...new Set(req.body.interests.map((t) => String(t).trim()).filter(Boolean))].slice(0, 8)
      : [];
    req.mentee.interests = interests;
    await req.mentee.save();
    res.json({ interests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// The frontend ships with a rules engine, so this is a pure upgrade: if ANTHROPIC_API_KEY is set,
// the server asks an LLM for a personalised paragraph; otherwise it returns { source: 'rules' }.
router.post('/ai-summary', authenticateMentee, async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) return res.json({ source: 'rules', summary: null });

    const { stats } = req.body; // computed client-side from the dashboard payload
    const prompt =
      'You are the friendly AI coach inside a student mentorship platform. Using ONLY the JSON stats below, ' +
      'write a warm, specific 3-4 sentence performance summary and end with one concrete next step. ' +
      'No markdown, no emojis, no invented numbers.\n\n' + JSON.stringify(stats || {});

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!response.ok) return res.json({ source: 'rules', summary: null });

    const data = await response.json();
    const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join(' ').trim();
    res.json({ source: 'llm', summary: text || null });
  } catch (err) {
    res.json({ source: 'rules', summary: null }); // never break the profile page
  }
});

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const scoreProjection = {
  $sum: {
    $map: {
      input: { $ifNull: ['$completedResources', []] },
      as: 'cr',
      in: { $ifNull: ['$$cr.score', 0] }
    }
  }
};

async function calculateRank(menteeId) {
  const me = await Mentee.findById(menteeId).select('streak lastActiveDate completedResources.score').lean();
  if (!me) return null;

  const myScore = (me.completedResources || []).reduce((s, c) => s + (c?.score || 0), 0);
  const myStreak = me.streak || 0;
  const myLast = me.lastActiveDate || new Date(0);

  const better = await Mentee.aggregate([
    { $project: { streak: { $ifNull: ['$streak', 0] }, lastActiveDate: 1, totalScore: scoreProjection } },
    {
      $match: {
        $or: [
          { totalScore: { $gt: myScore } },
          { totalScore: myScore, streak: { $gt: myStreak } },
          { totalScore: myScore, streak: myStreak, lastActiveDate: { $gt: myLast } }
        ]
      }
    },
    { $count: 'cnt' }
  ]);

  return (better[0]?.cnt || 0) + 1;
}

async function updateStreak(mentee) {
  const today = new Date().toDateString();
  const lastActive = mentee.lastActiveDate?.toDateString();
  if (lastActive !== today) {
    mentee.streak = lastActive === new Date(Date.now() - 86400000).toDateString() ? mentee.streak + 1 : 1;
    mentee.lastActiveDate = new Date();
  }
}

/* ------------------------------------------------------------------ */
/* Public leaderboard                                                  */
/* ------------------------------------------------------------------ */
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const skip = Math.max(parseInt(req.query.skip || '0', 10), 0);

    const rows = await Mentee.aggregate([
      { $project: { name: 1, streak: { $ifNull: ['$streak', 0] }, lastActiveDate: 1, totalScore: scoreProjection } },
      { $sort: { totalScore: -1, streak: -1, lastActiveDate: -1, _id: 1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    res.json(
      rows.map((m, i) => ({
        id: m._id,
        rank: skip + i + 1,
        name: m.name,
        totalScore: m.totalScore || 0,
        streak: m.streak || 0
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
