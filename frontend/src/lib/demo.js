// In-browser demo backend. It implements the same methods as the real API (see lib/api.js)
// so every screen works without MongoDB — handy for presentations and offline judging.
import { ApiError } from './http';

const DAY = 86400000;
const iso = (d) => new Date(Date.now() + d * DAY).toISOString();
const STORE_KEY = 'tn_demo_state';
const ME = 'e1'; // the demo mentee

const wait = (ms = 140) => new Promise((r) => setTimeout(r, ms));
let uid = 100;
const nextId = (p) => `${p}${++uid}`;

function seed() {
  const mentors = [
    { _id: 'm1', name: 'Aanya Sharma', email: 'mentor@techneeds.dev', programs: ['p1', 'p2'] },
    { _id: 'm2', name: 'Rohan Mehta', email: 'rohan@techneeds.dev', programs: [] }
  ];
  const programs = [
    { _id: 'p1', name: 'Web Development Cohort', mentors: ['m1'] },
    { _id: 'p2', name: 'DSA Sprint', mentors: ['m1'] }
  ];
  const resources = [
    { _id: 'r1', program: 'p1', title: 'HTML & CSS Crash Course', type: 'video', url: 'https://www.youtube.com/watch?v=G3e-cpL7ofc', maxScore: 100, deadline: iso(-3), isLocked: false },
    { _id: 'r2', program: 'p1', title: 'JavaScript Essentials', type: 'video', url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg', maxScore: 100, deadline: iso(4), isLocked: false },
    { _id: 'r3', program: 'p1', title: 'React in 60 Minutes', type: 'video', url: 'https://www.youtube.com/watch?v=Tn6-PIqc4UM', maxScore: 100, deadline: iso(9), isLocked: false },
    { _id: 'r4', program: 'p1', title: 'Web Fundamentals Quiz', type: 'quiz', maxScore: 5, deadline: iso(5), isLocked: false },
    { _id: 'r5', program: 'p1', title: 'Build a Portfolio Site', type: 'project', maxScore: 300, deadline: iso(12), isLocked: false },
    { _id: 'r6', program: 'p2', title: 'Arrays & Hashing', type: 'video', url: 'https://www.youtube.com/watch?v=KLlXCFG5TnA', maxScore: 100, deadline: iso(6), isLocked: false },
    { _id: 'r7', program: 'p2', title: 'Two Pointers Mini Quiz', type: 'quiz', maxScore: 3, deadline: iso(8), isLocked: true }
  ];
  const quizzes = {
    r4: {
      startTime: iso(-1), endTime: iso(5),
      questions: [
        { id: 'q1', questionText: 'Which HTML tag is used for the largest heading?', options: ['<h6>', '<h1>', '<head>', '<header>'], correctOptionIndex: 1, marks: 1 },
        { id: 'q2', questionText: 'Which CSS property controls text colour?', options: ['font-style', 'text-color', 'color', 'foreground'], correctOptionIndex: 2, marks: 1 },
        { id: 'q3', questionText: 'What does === check in JavaScript?', options: ['Value only', 'Type only', 'Value and type', 'Reference only'], correctOptionIndex: 2, marks: 1 },
        { id: 'q4', questionText: 'Which hook manages state in React?', options: ['useEffect', 'useState', 'useRef', 'useMemo'], correctOptionIndex: 1, marks: 1 },
        { id: 'q5', questionText: 'What does the "C" in CSS stand for?', options: ['Creative', 'Cascading', 'Computed', 'Coded'], correctOptionIndex: 1, marks: 1 }
      ]
    },
    r7: {
      startTime: iso(-1), endTime: iso(8),
      questions: [
        { id: 'q6', questionText: 'Two pointers works best on…', options: ['Sorted arrays', 'Hash maps', 'Heaps', 'Tries'], correctOptionIndex: 0, marks: 1 },
        { id: 'q7', questionText: 'Typical time complexity of a two-pointer scan?', options: ['O(n²)', 'O(log n)', 'O(n)', 'O(n log n)'], correctOptionIndex: 2, marks: 2 }
      ]
    }
  };
  const done = (resource, score, extra = {}) => ({ resource, score, completedOn: iso(-Math.floor(Math.random() * 5)), verified: true, ...extra });
  const mentees = [
    { _id: 'e1', name: 'Riya Verma', email: 'riya@example.com', enrollmentNumber: 'TN2026001', programs: ['p1', 'p2'], interests: ['Web Dev', 'UI/UX'], streak: 6, completed: [done('r1', 100), done('r2', 100), done('r6', 100)] },
    { _id: 'e2', name: 'Ishita Gupta', email: 'ishita@example.com', enrollmentNumber: 'TN2026002', programs: ['p1', 'p2'], interests: ['AI/ML'], streak: 5, completed: [done('r1', 100), done('r2', 100), done('r4', 5), done('r5', 280, { githubLink: 'https://github.com/demo/ishita', deployedLink: 'https://ishita.vercel.app', description: 'Portfolio with a dark mode toggle and animated project cards.' })] },
    { _id: 'e3', name: 'Meera Nair', email: 'meera@example.com', enrollmentNumber: 'TN2026003', programs: ['p1', 'p2'], interests: ['Web Dev'], streak: 4, completed: [done('r1', 100), done('r4', 3), done('r5', 0, { verified: false, githubLink: 'https://github.com/demo/meera', deployedLink: 'https://meera.vercel.app', description: 'A minimal personal site built with Next.js and Tailwind, deployed on Vercel.' })] },
    { _id: 'e4', name: 'Kavya Singh', email: 'kavya@example.com', enrollmentNumber: 'TN2026004', programs: ['p1', 'p2'], interests: ['DSA'], streak: 3, completed: [done('r1', 100), done('r2', 98)] },
    { _id: 'e5', name: 'Tanvi Joshi', email: 'tanvi@example.com', enrollmentNumber: 'TN2026005', programs: ['p1', 'p2'], interests: ['Cloud'], streak: 2, completed: [done('r1', 100)] },
    { _id: 'e6', name: 'Sana Khan', email: 'sana@example.com', enrollmentNumber: 'TN2026006', programs: ['p1', 'p2'], interests: ['Cybersecurity'], streak: 1, completed: [done('r1', 96)] },
    { _id: 'e7', name: 'Diya Patel', email: 'diya@example.com', enrollmentNumber: 'TN2026007', programs: ['p1', 'p2'], interests: [], streak: 0, completed: [] }
  ];
  return { mentors, programs, resources, quizzes, mentees };
}

let state = null;
function S() {
  if (!state) {
    try {
      state = JSON.parse(window.localStorage.getItem(STORE_KEY) || 'null');
    } catch {
      state = null;
    }
    state = state || seed();
  }
  return state;
}
const save = () => {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: demo still works in memory */
  }
};
export function resetDemoState() {
  state = seed();
  save();
}

const sum = (arr) => arr.reduce((a, b) => a + (b || 0), 0);
const scoreOf = (m) => sum(m.completed.map((c) => c.score));
const byId = (list, id) => list.find((x) => x._id === id);

function rankedRows() {
  return S()
    .mentees.map((m) => ({ id: m._id, name: m.name, totalScore: scoreOf(m), streak: m.streak }))
    .sort((a, b) => b.totalScore - a.totalScore || b.streak - a.streak)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

function dashboardFor(menteeId) {
  const s = S();
  const m = byId(s.mentees, menteeId);
  const programs = m.programs.map((pid) => {
    const p = byId(s.programs, pid);
    const resources = s.resources
      .filter((r) => r.program === pid)
      .map((r) => {
        const c = m.completed.find((x) => x.resource === r._id);
        const quiz = s.quizzes[r._id];
        return {
          ...r,
          completed: !!c,
          score: c ? c.score : null,
          completedOn: c ? c.completedOn : null,
          verified: c ? (r.type === 'project' ? !!c.verified : true) : false,
          quizWindow: quiz ? { startTime: quiz.startTime, endTime: quiz.endTime, questionCount: quiz.questions.length } : undefined
        };
      });
    return { _id: p._id, name: p.name, resources };
  });
  const completedResources = m.completed.map((c) => {
    const r = byId(s.resources, c.resource);
    return { resourceId: r._id, title: r.title, type: r.type, maxScore: r.maxScore, deadline: r.deadline, score: c.score, completedOn: c.completedOn, verified: r.type === 'project' ? !!c.verified : true };
  });
  return {
    id: m._id, name: m.name, email: m.email, enrollmentNumber: m.enrollmentNumber, interests: m.interests, streak: m.streak,
    totalScore: scoreOf(m), programs, completedResources, rank: rankedRows().find((r) => r.id === m._id)?.rank
  };
}

const markActive = (m) => { m.streak = Math.max(m.streak, 0) + (m.activeToday ? 0 : 1); m.activeToday = true; };

export const demoApi = {
  /* ----- auth (demo accepts any session created by "Try the demo") ----- */
  async adminLogin() { await wait(); return { token: 'demo-token' }; },
  async mentorLogin() { await wait(); return { token: 'demo-token', mentor: S().mentors[0] }; },
  async menteeLogin() { await wait(); return { token: 'demo-token' }; },

  /* ----- admin ----- */
  async getPrograms() { await wait(); const s = S(); return s.programs.map((p) => ({ ...p, mentors: p.mentors.map((id) => byId(s.mentors, id)) })); },
  async getMentors() { await wait(); return S().mentors; },
  async createProgram(name) { await wait(); const p = { _id: nextId('p'), name, mentors: [] }; S().programs.push(p); save(); return p; },
  async createMentor({ name, email }) { await wait(); const m = { _id: nextId('m'), name, email, programs: [] }; S().mentors.push(m); save(); return m; },
  async assignMentor(programId, mentorId) {
    await wait();
    const s = S();
    const p = byId(s.programs, programId); const m = byId(s.mentors, mentorId);
    if (!p || !m) throw new ApiError('Program/Mentor not found', { status: 404 });
    if (!p.mentors.includes(mentorId)) p.mentors.push(mentorId);
    if (!m.programs.includes(programId)) m.programs.push(programId);
    save();
    return { program: p, mentor: m };
  },

  /* ----- mentor ----- */
  async getMyPrograms() { await wait(); const s = S(); return s.programs.filter((p) => p.mentors.includes('m1')).map((p) => ({ ...p })); },
  async getProgramMentees(programId) {
    await wait();
    const s = S();
    return s.mentees.filter((m) => m.programs.includes(programId)).map((m) => ({
      _id: m._id, name: m.name, email: m.email, enrollmentNumber: m.enrollmentNumber, streak: m.streak, totalScore: scoreOf(m),
      completedResources: m.completed.map((c) => ({ ...c, resource: byId(s.resources, c.resource) }))
    }));
  },
  async getProgramResources(programId) { await wait(); return S().resources.filter((r) => r.program === programId).reverse(); },
  async addMentee({ name, email, enrollmentNumber, programId }) {
    await wait();
    const s = S();
    const en = (enrollmentNumber || '').trim() || `TN2026${String(100 + s.mentees.length)}`;
    if (s.mentees.some((m) => m.enrollmentNumber === en)) throw new ApiError(`Enrollment number ${en} already exists`, { status: 409 });
    const mentee = { _id: nextId('e'), name, email, enrollmentNumber: en, programs: [programId], interests: [], streak: 0, completed: [] };
    s.mentees.push(mentee);
    save();
    return { mentee, tempPassword: Math.random().toString(36).slice(-8) };
  },
  async resetMenteePassword() { await wait(); return { tempPassword: Math.random().toString(36).slice(-8) }; },
  async addResource(data, isQuiz) {
    await wait();
    const s = S();
    const r = { _id: nextId('r'), program: data.program, title: data.title, type: isQuiz ? 'quiz' : data.type, url: data.url, maxScore: data.maxScore || 100, deadline: isQuiz ? data.endTime : data.deadline || iso(7), isLocked: !!isQuiz };
    s.resources.push(r);
    if (isQuiz) s.quizzes[r._id] = { startTime: data.startTime, endTime: data.endTime, questions: data.questions.map((q, i) => ({ ...q, id: `${r._id}-${i}` })) };
    save();
    return r;
  },
  async setResourceLock(id, isLocked) { await wait(); const r = byId(S().resources, id); r.isLocked = isLocked; save(); return r; },
  async getUnverified() {
    await wait();
    const s = S();
    const out = [];
    s.mentees.forEach((m) => m.completed.forEach((c) => {
      const r = byId(s.resources, c.resource);
      if (r.type === 'project' && !c.verified) out.push({ menteeId: m._id, menteeName: m.name, resourceId: r._id, resourceTitle: r.title, maxScore: r.maxScore, githubLink: c.githubLink, deployedLink: c.deployedLink, description: c.description, submittedOn: c.completedOn });
    }));
    return out;
  },
  async verifyProject(menteeId, resourceId, score) {
    await wait();
    const s = S();
    const c = byId(s.mentees, menteeId).completed.find((x) => x.resource === resourceId);
    c.score = Math.min(Number(score) || 0, byId(s.resources, resourceId).maxScore);
    c.verified = true;
    save();
    return { finalScore: c.score };
  },

  /* ----- mentee ----- */
  async getDashboard() { await wait(); return dashboardFor(ME); },
  async completeResource(id) {
    await wait();
    const s = S(); const m = byId(s.mentees, ME); const r = byId(s.resources, id);
    if (r.type !== 'video') throw new ApiError('Quizzes and projects must be submitted, not ticked off', { status: 400 });
    if (!m.completed.some((c) => c.resource === id)) { m.completed.push({ resource: id, score: r.maxScore, completedOn: new Date().toISOString(), verified: true }); markActive(m); }
    save();
    return { message: 'Resource marked as completed!', score: r.maxScore };
  },
  async getQuiz(id) {
    await wait();
    const s = S(); const q = s.quizzes[id]; const r = byId(s.resources, id);
    return { title: r.title, startTime: q.startTime, endTime: q.endTime, maxScore: r.maxScore, questions: q.questions.map(({ correctOptionIndex, ...rest }) => rest) };
  },
  async submitQuiz(id, answers) {
    await wait(300);
    const s = S(); const m = byId(s.mentees, ME); const q = s.quizzes[id];
    let score = 0;
    q.questions.forEach((question) => {
      const a = answers.find((x) => x.questionId === question.id);
      if (a && a.selectedOptionIndex === question.correctOptionIndex) score += question.marks || 1;
    });
    if (m.completed.some((c) => c.resource === id)) throw new ApiError('Quiz already submitted', { status: 409 });
    m.completed.push({ resource: id, score, completedOn: new Date().toISOString(), verified: true });
    markActive(m);
    save();
    return { score, maxScore: byId(s.resources, id).maxScore };
  },
  async submitProject(id, { githubLink, deployedLink, description }) {
    await wait(300);
    const m = byId(S().mentees, ME);
    const existing = m.completed.find((c) => c.resource === id);
    if (existing) Object.assign(existing, { githubLink, deployedLink, description, completedOn: new Date().toISOString() });
    else { m.completed.push({ resource: id, score: 0, completedOn: new Date().toISOString(), verified: false, githubLink, deployedLink, description }); markActive(m); }
    save();
    return { message: 'Project submitted! Your mentor will review it soon.' };
  },
  async updateInterests(interests) { await wait(); byId(S().mentees, ME).interests = interests; save(); return { interests }; },
  async getAiSummary() { await wait(); return { source: 'rules', summary: null }; },

  /* ----- public ----- */
  async getLeaderboard() { await wait(); return rankedRows(); }
};
