// Single place to point the frontend at a backend.
// Local development: the backend runs on http://localhost:8000 (see backend/.env -> PORT).
// To use a deployed backend, set NEXT_PUBLIC_API_URL in frontend/.env.local, e.g.
//   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');
