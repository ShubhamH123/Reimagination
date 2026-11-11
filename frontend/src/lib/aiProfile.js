// AI profile engine.
// Turns a mentee's raw dashboard payload into a persona, skill levels, badges, a written
// performance summary and ranked recommendations. It is deterministic and runs entirely in the
// browser, so the feature always works; the backend can optionally replace the summary text with
// an LLM-written one (see POST /api/m/ai-summary).

export const INTEREST_OPTIONS = [
  'Web Dev', 'AI/ML', 'App Dev', 'DSA', 'Data Science', 'Cloud', 'Cybersecurity', 'UI/UX', 'Open Source', 'Competitive Coding'
];

// Which words in a resource title count towards an interest tag.
const KEYWORDS = {
  'Web Dev': ['html', 'css', 'javascript', 'js', 'react', 'next', 'node', 'web', 'portfolio', 'frontend', 'tailwind'],
  'AI/ML': ['ml', 'machine', 'learning', 'neural', 'ai', 'model', 'deep'],
  'App Dev': ['android', 'flutter', 'kotlin', 'swift', 'mobile', 'app'],
  DSA: ['array', 'hash', 'graph', 'tree', 'dsa', 'algorithm', 'pointer', 'sorting', 'dp', 'recursion'],
  'Data Science': ['data', 'pandas', 'numpy', 'analysis', 'visual', 'sql'],
  Cloud: ['cloud', 'aws', 'docker', 'devops', 'kubernetes', 'deploy'],
  Cybersecurity: ['security', 'cyber', 'crypto', 'hacking', 'network'],
  'UI/UX': ['design', 'figma', 'ux', 'ui', 'css', 'portfolio'],
  'Open Source': ['git', 'github', 'open', 'source', 'contribution'],
  'Competitive Coding': ['contest', 'codeforces', 'competitive', 'leetcode', 'algorithm', 'dsa']
};

const TYPE_META = {
  video: { key: 'learner', label: 'Concept Learner', noun: 'videos', icon: 'fa-play' },
  quiz: { key: 'thinker', label: 'Quiz Thinker', noun: 'quizzes', icon: 'fa-bolt' },
  project: { key: 'builder', label: 'Project Builder', noun: 'projects', icon: 'fa-hammer' }
};

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const daysUntil = (iso) => (iso ? (new Date(iso) - Date.now()) / 86400000 : null);
const words = (s = '') => s.toLowerCase().split(/[^a-z0-9+#]+/).filter(Boolean);

function levelFor(xp) {
  const level = 1 + Math.floor(Math.sqrt(xp / 60));
  const floor = 60 * (level - 1) ** 2;
  const ceil = 60 * level ** 2;
  return { level, progress: clamp(Math.round(((xp - floor) / (ceil - floor)) * 100)), toNext: Math.max(0, ceil - xp) };
}

function matchesInterest(resource, interest) {
  const ws = words(resource.title);
  return (KEYWORDS[interest] || words(interest)).some((k) => ws.includes(k));
}

const PERSONAS = {
  fresh: { title: 'Fresh Starter', tagline: 'Your journey begins with one small win.', hue: 215, accessory: 'none' },
  learner: { title: 'Curious Explorer', tagline: 'Always watching, always learning.', hue: 28, accessory: 'glasses' },
  thinker: { title: 'Sharp Thinker', tagline: 'Quick on your feet when the quiz starts.', hue: 262, accessory: 'headphones' },
  builder: { title: 'Hands-on Builder', tagline: 'You learn by shipping real things.', hue: 168, accessory: 'cap' },
  steady: { title: 'Steady Streaker', tagline: 'Consistency is your superpower.', hue: 340, accessory: 'spark' }
};

/**
 * @param {object} data  dashboard payload from GET /api/m/dashboard
 * @param {object} [opts] { leaderboard: [{rank,totalScore,name}] } to enable rank-gap insights
 */
export function buildProfile(data, opts = {}) {
  const programs = data.programs || [];
  const all = programs.flatMap((p) => p.resources.map((r) => ({ ...r, programName: p.name })));
  const done = all.filter((r) => r.completed);
  const streak = data.streak || 0;
  const rank = data.rank || null;
  const totalMentees = opts.leaderboard?.length || null;

  /* ---------- per-type stats ---------- */
  const stats = {};
  ['video', 'quiz', 'project'].forEach((type) => {
    const of = all.filter((r) => r.type === type);
    const d = of.filter((r) => r.completed);
    const xp = d.reduce((s, r) => s + (r.score || 0), 0);
    const quality = type === 'quiz'
      ? pct(d.reduce((s, r) => s + (r.score || 0), 0), d.reduce((s, r) => s + (r.maxScore || 0), 0))
      : null;
    stats[type] = { total: of.length, done: d.length, xp, quality, completion: pct(d.length, of.length) };
  });

  /* ---------- radar (0-100) ---------- */
  const verifiedProjects = done.filter((r) => r.type === 'project' && r.verified);
  const standing = rank && totalMentees ? clamp(Math.round(100 * (1 - (rank - 1) / Math.max(totalMentees, 1)))) : done.length ? 55 : 20;
  const radar = [
    { axis: 'Learning', value: stats.video.completion },
    { axis: 'Quizzing', value: stats.quiz.done ? stats.quiz.quality : 0 },
    { axis: 'Building', value: stats.project.done ? clamp(40 + verifiedProjects.length * 30 + stats.project.completion / 5) : 0 },
    { axis: 'Consistency', value: clamp(streak * 12) },
    { axis: 'Standing', value: standing }
  ];

  /* ---------- persona ---------- */
  let personaKey = 'fresh';
  if (done.length) {
    const scores = { learner: radar[0].value, thinker: radar[1].value, builder: radar[2].value, steady: radar[3].value + 5 };
    personaKey = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  }
  const persona = { ...PERSONAS[personaKey], key: personaKey };

  /* ---------- skills with levels ---------- */
  const skills = Object.entries(TYPE_META).map(([type, meta]) => {
    const s = stats[type];
    const lv = levelFor(s.xp);
    return {
      key: meta.key, label: meta.label, icon: meta.icon, level: lv.level, progress: lv.progress, toNext: lv.toNext,
      detail: `${s.done}/${s.total} ${meta.noun}`
    };
  });

  /* ---------- interest-driven skill badges ---------- */
  const interestBadges = (data.interests || []).map((tag) => {
    const matching = done.filter((r) => matchesInterest(r, tag)).length;
    const tier = matching >= 3 ? 'Specialist' : matching >= 1 ? 'Practitioner' : 'Explorer';
    return { id: `interest-${tag}`, label: `${tag} ${tier}`, icon: tier === 'Specialist' ? 'fa-gem' : tier === 'Practitioner' ? 'fa-seedling' : 'fa-compass', earned: true, hint: `${matching} matching resource${matching === 1 ? '' : 's'} completed`, tier };
  });

  /* ---------- achievement badges ---------- */
  const onTime = done.filter((r) => r.completedOn && r.deadline && new Date(r.completedOn) <= new Date(r.deadline)).length;
  const completion = pct(done.length, all.length);
  const badgeDefs = [
    { id: 'first', label: 'First Steps', icon: 'fa-shoe-prints', earned: done.length >= 1, hint: 'Complete your first resource' },
    { id: 'streak3', label: 'Streak Starter', icon: 'fa-fire', earned: streak >= 3, hint: `Reach a 3-day streak (now ${streak})` },
    { id: 'streak7', label: 'On Fire', icon: 'fa-fire-flame-curved', earned: streak >= 7, hint: `Reach a 7-day streak (now ${streak})` },
    { id: 'quiz', label: 'Quiz Whiz', icon: 'fa-bolt', earned: stats.quiz.done > 0 && stats.quiz.quality >= 80, hint: 'Score 80%+ across your quizzes' },
    { id: 'builder', label: 'Shipped It', icon: 'fa-rocket', earned: stats.project.done >= 1, hint: 'Submit a project' },
    { id: 'verified', label: 'Mentor Approved', icon: 'fa-circle-check', earned: verifiedProjects.length >= 1, hint: 'Get a project verified by your mentor' },
    { id: 'early', label: 'Early Bird', icon: 'fa-sun', earned: onTime >= 3, hint: `Finish 3 resources before deadline (now ${onTime})` },
    { id: 'top10', label: 'Top 10', icon: 'fa-ranking-star', earned: !!rank && rank <= 10 && done.length > 0, hint: 'Reach the top 10 on the leaderboard' },
    { id: 'podium', label: 'Podium', icon: 'fa-trophy', earned: !!rank && rank <= 3 && done.length > 0, hint: 'Reach the top 3 on the leaderboard' },
    { id: 'complete', label: 'Completionist', icon: 'fa-star', earned: all.length > 0 && completion >= 80, hint: 'Complete 80% of all resources' }
  ];

  /* ---------- recommendations ---------- */
  const weakest = Object.entries(stats).filter(([, s]) => s.total > s.done).sort((a, b) => a[1].completion - b[1].completion)[0]?.[0];
  const pending = all.filter((r) => !r.completed && !r.isLocked).map((r) => {
    const d = daysUntil(r.deadline);
    let score = 0;
    const reasons = [];
    if (d !== null && d < 0) { score += 60; reasons.push('Overdue — finish it to stop losing points'); }
    else if (d !== null && d <= 3) { score += 45 - d * 5; reasons.push(`Due in ${Math.max(1, Math.ceil(d))} day${Math.ceil(d) === 1 ? '' : 's'}`); }
    const hit = (data.interests || []).find((i) => matchesInterest(r, i));
    if (hit) { score += 25; reasons.push(`Matches your ${hit} interest`); }
    if (r.type === weakest) { score += 15; reasons.push(`Builds your ${TYPE_META[r.type].label} skill`); }
    score += Math.min(10, (r.maxScore || 0) / 40);
    if (!reasons.length) reasons.push(`Worth up to ${r.maxScore} points`);
    return { resource: r, score, reasons };
  }).sort((a, b) => b.score - a.score);
  const recommendations = pending.slice(0, 3).map((p) => ({ id: p.resource._id, title: p.resource.title, type: p.resource.type, programName: p.resource.programName, reason: p.reasons.slice(0, 2).join(' · '), points: p.resource.maxScore }));

  /* ---------- rank-gap insight ---------- */
  let nextRank = null;
  if (opts.leaderboard && rank && rank > 1) {
    const above = opts.leaderboard.find((r) => r.rank === rank - 1);
    if (above) nextRank = { target: rank - 1, name: above.name, gap: Math.max(1, above.totalScore - (data.totalScore || 0) + 1) };
  }

  /* ---------- summary ---------- */
  const best = [...skills].sort((a, b) => b.level - a.level || b.progress - a.progress)[0];
  const parts = [];
  if (!done.length) {
    parts.push(`Welcome, ${data.name.split(' ')[0]}! You haven't completed anything yet, which just means every point is still up for grabs.`);
    parts.push(recommendations[0] ? `A great first move is “${recommendations[0].title}”.` : 'Check back as soon as your mentor posts the first resource.');
  } else {
    parts.push(`${data.name.split(' ')[0]}, you've completed ${done.length} of ${all.length} resources (${completion}%) and earned ${data.totalScore || 0} points${rank ? `, which puts you at #${rank}${totalMentees ? ` of ${totalMentees}` : ''}` : ''}.`);
    parts.push(`Your strongest area is ${best.label.toLowerCase()} (level ${best.level})${streak >= 3 ? ` and your ${streak}-day streak shows real consistency` : streak > 0 ? `, and you're building a ${streak}-day streak` : ''}.`);
    if (stats.quiz.done && stats.quiz.quality < 80) parts.push(`Quiz accuracy is ${stats.quiz.quality}% — revisiting the videos before your next quiz could lift it.`);
    else if (stats.project.total > stats.project.done) parts.push('Shipping a project is the fastest way to unlock your Builder badges.');
    if (nextRank) parts.push(`You're only ${nextRank.gap} points from #${nextRank.target}.`);
  }

  return {
    persona, radar, skills, stats, completion, onTime,
    badges: [...interestBadges, ...badgeDefs],
    earnedCount: [...interestBadges, ...badgeDefs].filter((b) => b.earned).length,
    recommendations, nextRank,
    summary: parts.join(' '),
    // compact stats payload for the optional LLM summary endpoint
    llmStats: {
      name: data.name.split(' ')[0], persona: persona.title, rank, totalMentees, totalScore: data.totalScore || 0, streak,
      completion, completed: done.length, total: all.length,
      quizAccuracy: stats.quiz.quality, projectsSubmitted: stats.project.done, interests: data.interests || [],
      nextRecommendation: recommendations[0]?.title || null
    },
    avatar: { seed: data.name, hue: persona.hue, accessory: persona.accessory, mood: streak >= 3 ? 'happy' : 'calm' }
  };
}
