'use client';
import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../lib/config';
import './mentee.css';

export default function ProjectSubmissionForm({ resourceId, onSubmitted, onCancel }) {
  const [githubLink, setGithubLink] = useState('');
  const [deployedLink, setDeployedLink] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('menteeToken');
      const res = await axios.post(
        `${API_URL}/api/m/resources/${resourceId}/project`,
        { githubLink, deployedLink, description },
        { headers: { 'x-auth-token': token } }
      );
      onSubmitted(res.data.score || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit the project.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="tn-alert tn-alert-error" role="alert">{error}</div>}
      <div className="tn-field">
        <label htmlFor={`gh-${resourceId}`}>GitHub repository</label>
        <input id={`gh-${resourceId}`} className="tn-input" type="url" required value={githubLink} onChange={(e) => setGithubLink(e.target.value)} placeholder="https://github.com/you/project" />
      </div>
      <div className="tn-field">
        <label htmlFor={`live-${resourceId}`}>Live link</label>
        <input id={`live-${resourceId}`} className="tn-input" type="url" required value={deployedLink} onChange={(e) => setDeployedLink(e.target.value)} placeholder="https://your-project.vercel.app" />
      </div>
      <div className="tn-field">
        <label htmlFor={`d-${resourceId}`}>What did you build, and what did you learn?</label>
        <textarea id={`d-${resourceId}`} className="tn-textarea" rows={5} required value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="tn-btn tn-btn-teal" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit project'}</button>
        {onCancel && <button type="button" className="tn-btn tn-btn-ghost" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
