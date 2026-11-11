const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Mentor = require('../models/Mentor');
const Program = require('../models/Program');
const Resource = require('../models/Resource');
const Mentee = require('../models/Mentee');
const Quiz = require('../models/Quiz');
const { authenticate, authenticateAdmin } = require('../middleware/authMentor');
const router = express.Router();

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const generatePassword = () => Math.random().toString(36).slice(-8);

async function generateEnrollmentNumber() {
  const year = new Date().getFullYear();
  for (let i = 0; i < 20; i++) {
    const candidate = `TN${year}${Math.floor(1000 + Math.random() * 9000)}`;
    // eslint-disable-next-line no-await-in-loop
    if (!(await Mentee.exists({ enrollmentNumber: candidate }))) return candidate;
  }
  return `TN${year}${Date.now().toString().slice(-6)}`;
}

const stripPassword = (doc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj.password;
  return obj;
};

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */
router.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    return res.status(503).json({ error: 'Admin login is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env' });
  }
  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ role: 'admin', email }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
});

// Create Mentor (admin only)
router.post('/mentors', authenticateAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
    const salt = await bcrypt.genSalt(10);
    const mentor = new Mentor({ name, email, password: await bcrypt.hash(password, salt) });
    await mentor.save();
    res.status(201).json(stripPassword(mentor));
  } catch (err) {
    const msg = err.code === 11000 ? 'A mentor with this email already exists' : err.message;
    res.status(500).json({ error: msg });
  }
});

// Get all mentors (passwords never leave the server)
router.get('/mentors', async (req, res) => {
  try {
    const mentors = await Mentor.find().select('-password').populate('programs');
    res.json(mentors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all programs
router.get('/programs', async (req, res) => {
  try {
    const programs = await Program.find().populate('mentors', '-password');
    res.json(programs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Program (admin only)
router.post('/programs', authenticateAdmin, async (req, res) => {
  try {
    if (!req.body.name) return res.status(400).json({ error: 'Program name is required' });
    const program = new Program({ name: req.body.name });
    await program.save();
    res.status(201).json(program);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Mentor to Program (admin only)
router.post('/programs/:programId/add-mentor', authenticateAdmin, async (req, res) => {
  try {
    const program = await Program.findById(req.params.programId);
    const mentor = await Mentor.findById(req.body.mentorId);
    if (!program || !mentor) return res.status(404).json({ error: 'Program/Mentor not found' });

    if (!program.mentors.some((m) => m.equals(mentor._id))) program.mentors.push(mentor._id);
    if (!mentor.programs.some((p) => p.equals(program._id))) mentor.programs.push(program._id);

    await program.save();
    await mentor.save();
    res.json({ program, mentor: stripPassword(mentor) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/* Mentor auth                                                         */
/* ------------------------------------------------------------------ */
router.post('/mentors/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const mentor = await Mentor.findOne({ email });
    if (!mentor || !(await bcrypt.compare(password, mentor.password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: mentor._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, mentor: stripPassword(mentor) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/* Resources                                                           */
/* ------------------------------------------------------------------ */
router.post('/resources', authenticate, async (req, res) => {
  try {
    const program = await Program.findById(req.body.program);
    if (!program) return res.status(404).json({ error: 'Program not found' });
    if (!program.mentors.some((m) => m.equals(req.mentor._id))) {
      return res.status(403).json({ error: 'Not authorized for this program' });
    }

    const resource = new Resource({ ...req.body, addedBy: req.mentor._id });
    await resource.save();
    program.resources.push(resource._id);
    await program.save();
    res.status(201).json(resource);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/resources/quiz', authenticate, async (req, res) => {
  try {
    const { title, program, questions, startTime, endTime, maxScore } = req.body;

    const programDoc = await Program.findById(program);
    if (!programDoc) return res.status(404).json({ error: 'Program not found' });
    if (!programDoc.mentors.some((m) => m.equals(req.mentor._id))) {
      return res.status(403).json({ error: 'Not authorized for this program' });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'A quiz needs at least one question' });
    }

    const resource = new Resource({
      title,
      type: 'quiz',
      program,
      maxScore,
      isLocked: true, // mentor unlocks when the quiz should open (see PATCH /resources/:id/lock)
      addedBy: req.mentor._id,
      deadline: endTime
    });
    await resource.save();

    const quiz = new Quiz({ resource: resource._id, questions, startTime, endTime });
    await quiz.save();

    resource.quiz = quiz._id;
    await resource.save();

    programDoc.resources.push(resource._id);
    await programDoc.save();

    res.status(201).json({ message: 'Quiz resource created', resource, quiz });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Lock / unlock a resource (quizzes are created locked)
router.patch('/resources/:resourceId/lock', authenticate, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resourceId);
    if (!resource) return res.status(404).json({ error: 'Resource not found' });

    const program = await Program.findById(resource.program);
    if (!program || !program.mentors.some((m) => m.equals(req.mentor._id))) {
      return res.status(403).json({ error: 'Not authorized for this program' });
    }

    resource.isLocked = typeof req.body.isLocked === 'boolean' ? req.body.isLocked : !resource.isLocked;
    await resource.save();
    res.json(resource);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/* Mentees                                                             */
/* ------------------------------------------------------------------ */
// Mentor adds a mentee. Enrollment number is auto-generated if omitted;
// the temporary password is returned ONCE and stored hashed.
router.post('/mentees', authenticate, async (req, res) => {
  try {
    const { email, name, programId } = req.body;
    let { enrollmentNumber } = req.body;
    if (!email || !name) return res.status(400).json({ error: 'Name and email are required' });

    const program = await Program.findById(programId);
    if (!program) return res.status(404).json({ error: 'Program not found' });
    if (!program.mentors.some((m) => m.equals(req.mentor._id))) {
      return res.status(403).json({ error: 'Not authorized for this program' });
    }

    enrollmentNumber = (enrollmentNumber || '').trim() || (await generateEnrollmentNumber());
    if (await Mentee.exists({ enrollmentNumber })) {
      return res.status(409).json({ error: `Enrollment number ${enrollmentNumber} already exists` });
    }

    const tempPassword = generatePassword();
    const mentee = new Mentee({
      email,
      name,
      enrollmentNumber,
      password: await bcrypt.hash(tempPassword, 10),
      programs: [programId],
      createdBy: req.mentor._id
    });
    await mentee.save();

    res.status(201).json({ mentee: stripPassword(mentee), tempPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset a mentee's password and show the new temporary one once
router.post('/mentees/:menteeId/reset-password', authenticate, async (req, res) => {
  try {
    const mentee = await Mentee.findById(req.params.menteeId);
    if (!mentee) return res.status(404).json({ error: 'Mentee not found' });

    const mentorPrograms = req.mentor.programs.map((p) => p.toString());
    if (!mentee.programs.some((p) => mentorPrograms.includes(p.toString()))) {
      return res.status(403).json({ error: 'Not authorized for this mentee' });
    }

    const tempPassword = generatePassword();
    mentee.password = await bcrypt.hash(tempPassword, 10);
    await mentee.save();
    res.json({ tempPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mentees of a program (no passwords)
router.get('/:programId/mentees', authenticate, async (req, res) => {
  try {
    const mentees = await Mentee.find({ programs: req.params.programId })
      .select('-password')
      .populate('completedResources.resource', 'title type maxScore');
    res.json(mentees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:programId/resources', authenticate, async (req, res) => {
  try {
    const resources = await Resource.find({ program: req.params.programId }).sort({ createdAt: -1 });
    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/* Project review                                                      */
/* ------------------------------------------------------------------ */
router.patch('/:menteeId/resources/:resourceId/verify', authenticate, async (req, res) => {
  try {
    const { menteeId, resourceId } = req.params;
    const score = Number(req.body.score);
    if (Number.isNaN(score) || score < 0) return res.status(400).json({ error: 'A valid score is required' });

    const resource = await Resource.findById(resourceId);
    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    if (resource.type !== 'project') {
      return res.status(400).json({ error: 'Only project-type resources can be verified' });
    }
    if (resource.isLocked) return res.status(403).json({ error: 'Resource is currently locked' });

    const mentee = await Mentee.findById(menteeId);
    if (!mentee) return res.status(404).json({ error: 'Mentee not found' });

    const submission = mentee.completedResources.find((e) => e.resource.toString() === resourceId);
    if (!submission) return res.status(400).json({ error: 'Project not yet submitted by this mentee' });
    if (submission.verified) return res.status(400).json({ error: 'This project has already been verified' });

    const finalScore = Math.min(score, resource.maxScore);
    submission.score = finalScore;
    submission.verified = true;
    mentee.totalScore += finalScore;
    await mentee.save();

    res.json({ message: 'Project verified and scored', finalScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/unverified-projects', authenticate, async (req, res) => {
  try {
    const mentor = req.mentor;
    const mentorPrograms = mentor.programs.map((p) => p.toString());

    const mentees = await Mentee.find({ 'completedResources.verified': false }).populate({
      path: 'completedResources.resource',
      populate: { path: 'program' }
    });

    const unverifiedProjects = [];
    mentees.forEach((mentee) => {
      mentee.completedResources.forEach((entry) => {
        const resObj = entry.resource;
        if (
          resObj &&
          resObj.type === 'project' &&
          entry.verified === false &&
          resObj.program &&
          mentorPrograms.includes(resObj.program._id.toString())
        ) {
          unverifiedProjects.push({
            menteeId: mentee._id,
            menteeName: mentee.name,
            resourceId: resObj._id,
            resourceTitle: resObj.title,
            maxScore: resObj.maxScore,
            githubLink: entry.githubLink,
            deployedLink: entry.deployedLink,
            description: entry.description,
            submittedOn: entry.submittedOn
          });
        }
      });
    });

    res.json({ unverifiedProjects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
