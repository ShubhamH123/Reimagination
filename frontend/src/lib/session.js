// Tiny wrapper around localStorage (safe on the server and in private mode).
const KEYS = { admin: 'tn_admin_token', mentor: 'token', mentee: 'menteeToken' };
const DEMO_KEY = 'tn_demo';

const ls = () => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
};

export const getToken = (role) => ls()?.getItem(KEYS[role]) || '';
export const setToken = (role, token) => ls()?.setItem(KEYS[role], token);
export const clearSession = (role) => {
  ls()?.removeItem(KEYS[role]);
  if (role === 'mentor') ls()?.removeItem('mentor');
};

export const getMentor = () => {
  try {
    return JSON.parse(ls()?.getItem('mentor') || 'null');
  } catch {
    return null;
  }
};
export const setMentor = (mentor) => ls()?.setItem('mentor', JSON.stringify(mentor));

export const isDemo = () => ls()?.getItem(DEMO_KEY) === '1';
export const enterDemo = (role) => {
  const store = ls();
  if (!store) return;
  store.setItem(DEMO_KEY, '1');
  store.setItem(KEYS[role], 'demo-token');
  if (role === 'mentor') store.setItem('mentor', JSON.stringify({ _id: 'm1', name: 'Aanya Sharma', email: 'mentor@techneeds.dev', programs: ['p1', 'p2'] }));
};
export const exitDemo = () => {
  const store = ls();
  if (!store) return;
  store.removeItem(DEMO_KEY);
  Object.values(KEYS).forEach((k) => store.removeItem(k));
  store.removeItem('mentor');
};
