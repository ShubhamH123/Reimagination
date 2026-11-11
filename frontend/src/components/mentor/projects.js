'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../lib/config';

const UnverifiedProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = () => localStorage.getItem('token'); // mentor token key used by the mentor panel

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/unverified-projects`, { headers: { 'x-auth-token': token() } });
      setProjects(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load submissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (menteeId, resourceId, score) => {
    setError('');
    try {
      await axios.patch(`${API_URL}/api/${menteeId}/resources/${resourceId}/verify`, { score }, { headers: { 'x-auth-token': token() } });
      setProjects((prev) => prev.filter((p) => !(p.menteeId === menteeId && p.resourceId === resourceId)));
    } catch (err) {
      setError(err.response?.data?.error || 'Could not verify this project.');
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  if (loading) return <p className="tn-muted">Loading submissions…</p>;

  return (
    <div className="section">
      <h3>Projects waiting for review</h3>
      {error && <div className="tn-alert tn-alert-error" role="alert">{error}</div>}
      {projects.length === 0 ? (
        <p className="tn-muted">All caught up. New submissions will show up here.</p>
      ) : projects.map((proj, index) => (
        <div key={`${proj.menteeId}-${proj.resourceId}`} className="question-block">
          <h4>{proj.resourceTitle}</h4>
          <p style={{ margin: '0 0 4px' }}><strong>{proj.menteeName}</strong>, submitted {new Date(proj.submittedOn).toLocaleString()}</p>
          <p style={{ margin: '0 0 4px' }}>
            <a href={proj.githubLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>GitHub</a>{' · '}
            <a href={proj.deployedLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Live link</a>
          </p>
          <p>{proj.description}</p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'start', flexWrap: 'wrap' }}>
            <input
              type="number" min="0" aria-label="Score" style={{ maxWidth: 140 }}
              value={proj.score ?? ''} placeholder="Score"
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setProjects((prev) => prev.map((p, i) => (i === index ? { ...p, score: Number.isNaN(v) ? '' : v } : p)));
              }}
            />
            <button onClick={() => handleVerify(proj.menteeId, proj.resourceId, proj.score)}>Verify and award score</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UnverifiedProjects;
