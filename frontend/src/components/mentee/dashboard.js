'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { API_URL } from '../../lib/config';
import QuizAttempt from './QuizAttempt';
import ProjectSubmissionForm from './ProjectSubmission';
import './mentee.css';

const TYPE_ICON = { video: 'fa-circle-play', quiz: 'fa-list-check', project: 'fa-code-branch' };
const TABS = [['all', 'All'], ['video', 'Videos'], ['quiz', 'Quizzes'], ['project', 'Projects']];

function deadlineChip(deadline, done) {
  if (!deadline || done) return null;
  const days = Math.ceil((new Date(deadline) - Date.now()) / 86400000);
  if (days < 0) return <span className="tn-chip tn-chip-coral">{Math.abs(days)}d late, points drop daily</span>;
  if (days === 0) return <span className="tn-chip tn-chip-gold">due today</span>;
  return <span className={`tn-chip ${days <= 2 ? 'tn-chip-gold' : 'tn-chip-teal'}`}>{days}d left</span>;
}

export default function MenteeDashboard() {
  const [mentee, setMentee] = useState(null);
  const [openPanel, setOpenPanel] = useState(null); // `${type}:${id}`
  const [tab, setTab] = useState('all');
  const [notice, setNotice] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('menteeToken');
    if (!token) { router.push('/mentee'); return; }
    axios.get(`${API_URL}/api/m/dashboard`, { headers: { 'x-auth-token': token } })
      .then((res) => setMentee(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem('menteeToken');
          router.push('/mentee');
        } else {
          setNotice({ kind: 'error', text: `Cannot reach the server at ${API_URL}.` });
        }
      });
  }, [router]);

  const markDone = (resourceId, score) => {
    setMentee((prev) => ({
      ...prev,
      totalScore: (prev.totalScore || 0) + (score || 0),
      programs: prev.programs.map((p) => ({
        ...p,
        resources: p.resources.map((r) => (r._id === resourceId
          ? { ...r, completed: true, score, completedOn: new Date().toISOString() } : r)),
      })),
    }));
    setOpenPanel(null);
  };

  const completeVideo = async (resourceId) => {
    try {
      const token = localStorage.getItem('menteeToken');
      const res = await axios.post(`${API_URL}/api/m/resources/${resourceId}/complete`, {}, { headers: { 'x-auth-token': token } });
      markDone(resourceId, res.data.score);
      setNotice({ kind: 'ok', text: `Done! You earned ${res.data.score} points.` });
    } catch (err) {
      setNotice({ kind: 'error', text: err.response?.data?.error || 'Something went wrong.' });
    }
  };

  if (!mentee) {
    return notice ? <div className="tn-page-narrow"><div className="tn-alert tn-alert-error">{notice.text}</div></div>
      : <div className="tn-spinner" role="status" aria-label="Loading" />;
  }

  return (
    <div className="tn-page">
      <div className="tn-dash-top">
        <div>
          <h1 className="tn-title tn-h1">Hi {mentee.name.split(' ')[0]}</h1>
          <p className="tn-lead">Finish things before their deadline to keep every point.</p>
        </div>
        <Link href="/profile" className="tn-btn tn-btn-gold"><i className="fa-solid fa-wand-magic-sparkles" /> See my AI profile</Link>
      </div>

      <div className="tn-stats">
        <div className="tn-stat"><strong>#{mentee.rank}</strong><span>rank</span></div>
        <div className="tn-stat"><strong>{mentee.totalScore}</strong><span>points</span></div>
        <div className="tn-stat"><strong>{mentee.streak}</strong><span>day streak</span></div>
      </div>

      {notice && <div className={`tn-alert ${notice.kind === 'ok' ? 'tn-alert-ok' : 'tn-alert-error'}`} role="status">{notice.text}</div>}

      <div className="tn-tabs" role="tablist" aria-label="Filter resources">
        {TABS.map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} className={`tn-tab ${tab === key ? 'is-on' : ''}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {mentee.programs.length === 0 && <div className="tn-card tn-empty">You are not in a program yet. Ask your mentor to add you.</div>}

      {mentee.programs.map((program) => {
        const items = program.resources.filter((r) => tab === 'all' || r.type === tab);
        const done = program.resources.filter((r) => r.completed).length;
        return (
          <section key={program._id} style={{ marginTop: 28 }}>
            <div className="tn-section-head">
              <h2 className="tn-title tn-h2">{program.name}</h2>
              <span className="tn-chip tn-chip-teal">{done} of {program.resources.length} done</span>
            </div>
            {items.length === 0 ? <div className="tn-card tn-empty">Nothing here yet.</div> : (
              <div className="tn-res-list">
                {items.map((res) => {
                  const key = `${res.type}:${res._id}`;
                  return (
                    <article key={res._id} className={`tn-res type-${res.type} ${res.completed ? 'is-done' : ''}`}>
                      <span className="tn-res-icon"><i className={`fa-solid ${TYPE_ICON[res.type] || 'fa-book'}`} /></span>
                      <div>
                        <h3>{res.title}</h3>
                        <div className="tn-res-meta">
                          <span className="tn-chip">{res.type}</span>
                          <span className="tn-chip tn-chip-gold">{res.maxScore} pts</span>
                          {res.isLocked && <span className="tn-chip tn-chip-coral"><i className="fa-solid fa-lock" /> locked</span>}
                          {deadlineChip(res.deadline, res.completed)}
                          {res.deadline && <span className="tn-muted" style={{ fontSize: '.85rem' }}>by {new Date(res.deadline).toLocaleDateString()}</span>}
                        </div>
                        {res.url && <a className="tn-res-link" href={res.url} target="_blank" rel="noopener noreferrer">Open resource</a>}
                      </div>
                      <div className="tn-res-action">
                        {res.completed ? (
                          <span className="tn-chip tn-chip-mint"><i className="fa-solid fa-circle-check" /> {res.score} pts</span>
                        ) : res.isLocked ? null : res.type === 'video' ? (
                          <button className="tn-btn tn-btn-teal tn-btn-sm" onClick={() => completeVideo(res._id)}>Mark as watched</button>
                        ) : res.type === 'quiz' ? (
                          <button className="tn-btn tn-btn-teal tn-btn-sm" onClick={() => setOpenPanel(openPanel === key ? null : key)}>{openPanel === key ? 'Close' : 'Attempt quiz'}</button>
                        ) : (
                          <button className="tn-btn tn-btn-teal tn-btn-sm" onClick={() => setOpenPanel(openPanel === key ? null : key)}>{openPanel === key ? 'Close' : 'Submit project'}</button>
                        )}
                      </div>
                      {openPanel === key && !res.completed && (
                        <div className="tn-res-panel">
                          {res.type === 'quiz' ? (
                            <QuizAttempt resourceId={res._id} onCancel={() => setOpenPanel(null)}
                              onComplete={(score) => { markDone(res._id, score); setNotice({ kind: 'ok', text: `Quiz submitted. You scored ${score}.` }); }} />
                          ) : (
                            <ProjectSubmissionForm resourceId={res._id} onCancel={() => setOpenPanel(null)}
                              onSubmitted={(score) => { markDone(res._id, score); setNotice({ kind: 'ok', text: 'Project submitted. Your mentor will review it.' }); }} />
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
