// One API surface for the whole app. Components call `api.something()`; this file decides whether
// that hits the real Express backend (lib/http.js) or the in-browser demo store (lib/demo.js).
import { request } from './http';
import { demoApi } from './demo';
import { getToken, getMentor, isDemo } from './session';

const post = (path, body, role) => request(path, { method: 'POST', body, token: role ? getToken(role) : undefined });
const get = (path, role) => request(path, { token: role ? getToken(role) : undefined });

const realApi = {
  /* ----- auth ----- */
  adminLogin: (email, password) => post('/api/admin/login', { email, password }),
  mentorLogin: (email, password) => post('/api/mentors/login', { email, password }),
  menteeLogin: (enrollmentNumber, password) => post('/api/m/login', { enrollmentNumber, password }),

  /* ----- admin ----- */
  getPrograms: () => get('/api/programs'),
  getMentors: () => get('/api/mentors'),
  createProgram: (name) => post('/api/programs', { name }, 'admin'),
  createMentor: (data) => post('/api/mentors', data, 'admin'),
  assignMentor: (programId, mentorId) => post(`/api/programs/${programId}/add-mentor`, { mentorId }, 'admin'),

  /* ----- mentor ----- */
  // Derived from live program data, so assignments made after login show up without re-signing in.
  async getMyPrograms() {
    const me = String(getMentor()?._id || '');
    const all = await get('/api/programs');
    return all.filter((p) => (p.mentors || []).some((m) => String(m._id || m) === me));
  },
  getProgramMentees: (programId) => get(`/api/${programId}/mentees`, 'mentor'),
  getProgramResources: (programId) => get(`/api/${programId}/resources`, 'mentor'),
  addMentee: (data) => post('/api/mentees', data, 'mentor'),
  resetMenteePassword: (menteeId) => post(`/api/mentees/${menteeId}/reset-password`, {}, 'mentor'),
  addResource: (data, isQuiz = false) => post(isQuiz ? '/api/resources/quiz' : '/api/resources', data, 'mentor'),
  setResourceLock: (id, isLocked) => request(`/api/resources/${id}/lock`, { method: 'PATCH', body: { isLocked }, token: getToken('mentor') }),
  getUnverified: async () => (await get('/api/unverified-projects', 'mentor')).unverifiedProjects || [],
  verifyProject: (menteeId, resourceId, score) =>
    request(`/api/${menteeId}/resources/${resourceId}/verify`, { method: 'PATCH', body: { score }, token: getToken('mentor') }),

  /* ----- mentee ----- */
  getDashboard: () => get('/api/m/dashboard', 'mentee'),
  completeResource: (id) => post(`/api/m/resources/${id}/complete`, {}, 'mentee'),
  getQuiz: (id) => get(`/api/m/resources/${id}/quiz`, 'mentee'),
  submitQuiz: (id, answers) => post(`/api/m/resources/${id}/quiz/submit`, { answers }, 'mentee'),
  submitProject: (id, data) => post(`/api/m/resources/${id}/project`, data, 'mentee'),
  updateInterests: (interests) => request('/api/m/interests', { method: 'PUT', body: { interests }, token: getToken('mentee') }),
  getAiSummary: (stats) => post('/api/m/ai-summary', { stats }, 'mentee'),

  /* ----- public ----- */
  getLeaderboard: () => get('/api/m/leaderboard')
};

export const api = new Proxy(
  {},
  { get: (_, name) => (...args) => (isDemo() ? demoApi : realApi)[name](...args) }
);
