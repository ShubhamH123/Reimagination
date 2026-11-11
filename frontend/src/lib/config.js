// Backend base URL. Local default matches the hackathon brief (backend on port 8000).
// For a deployed backend, set NEXT_PUBLIC_API_URL (e.g. in Vercel project settings).
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
