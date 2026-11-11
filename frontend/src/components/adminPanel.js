"use client";

import { useEffect, useState } from 'react';
import { adminLogin, createProgram, createMentor, addMentorToProgram, getAllPrograms, getAllMentors } from '../lib/api';

export default function AdminPanel() {
  const [token, setToken] = useState(null); // null = not signed in, undefined = checking
  const [ready, setReady] = useState(false);
  const [creds, setCreds] = useState({ email: '', password: '' });
  const [programName, setProgramName] = useState('');
  const [mentorData, setMentorData] = useState({ name: '', email: '', password: '' });
  const [programs, setPrograms] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [assign, setAssign] = useState({}); // programId -> mentorId
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const flash = (kind, text) => setMsg({ kind, text });

  const fetchData = async (t) => {
    try {
      const [p, m] = await Promise.all([getAllPrograms(), getAllMentors(t)]);
      setPrograms(p);
      setMentors(m);
    } catch (err) {
      if (/expired|login required|Invalid/i.test(err.message)) { sessionStorage.removeItem('adminToken'); setToken(null); }
      else flash('error', err.message === 'Failed to fetch' ? 'Cannot reach the backend. Is it running?' : err.message);
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem('adminToken');
    if (saved) { setToken(saved); fetchData(saved); }
    setReady(true);
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const { token: t } = await adminLogin(creds.email, creds.password);
      sessionStorage.setItem('adminToken', t);
      setToken(t);
      await fetchData(t);
    } catch (err) {
      flash('error', err.message === 'Failed to fetch' ? 'Cannot reach the backend. Is it running?' : err.message);
    } finally { setBusy(false); }
  };

  const run = async (fn, okText, after) => {
    setBusy(true); setMsg(null);
    try { await fn(); flash('ok', okText); after && after(); await fetchData(token); }
    catch (err) { flash('error', err.message); }
    finally { setBusy(false); }
  };

  if (!ready) return <div className="tn-spinner" role="status" aria-label="Loading" />;

  if (!token) {
    return (
      <div className="tn-page-narrow">
        <h1 className="tn-title tn-h1">Admin login</h1>
        <p className="tn-lead">Create programs and onboard mentors.</p>
        <form className="tn-card" style={{ marginTop: 24 }} onSubmit={login}>
          {msg && <div className={`tn-alert tn-alert-${msg.kind === 'ok' ? 'ok' : 'error'}`} role="alert">{msg.text}</div>}
          <div className="tn-field"><label htmlFor="ae">Admin email</label>
            <input id="ae" className="tn-input" type="email" value={creds.email} onChange={(e) => setCreds({ ...creds, email: e.target.value })} required autoComplete="username" /></div>
          <div className="tn-field"><label htmlFor="ap">Password</label>
            <input id="ap" className="tn-input" type="password" value={creds.password} onChange={(e) => setCreds({ ...creds, password: e.target.value })} required autoComplete="current-password" /></div>
          <button className="tn-btn tn-btn-teal" style={{ width: '100%' }} disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="tn-page">
      <div className="tn-section-head">
        <div>
          <h1 className="tn-title tn-h1">Admin panel</h1>
          <p className="tn-lead">Create a program, onboard a mentor, then assign the mentor to the program.</p>
        </div>
        <button className="tn-btn tn-btn-ghost tn-btn-sm" onClick={() => { sessionStorage.removeItem('adminToken'); setToken(null); }}>Log out</button>
      </div>

      {msg && <div className={`tn-alert tn-alert-${msg.kind === 'ok' ? 'ok' : 'error'}`} role="status">{msg.text}</div>}

      <div className="tn-admin-grid">
        <form className="tn-card" onSubmit={(e) => { e.preventDefault(); run(() => createProgram(programName.trim(), token), 'Program created.', () => setProgramName('')); }}>
          <h2 className="tn-title tn-h3">1. Create a program</h2>
          <div className="tn-field"><label htmlFor="pn">Program name</label>
            <input id="pn" className="tn-input" value={programName} onChange={(e) => setProgramName(e.target.value)} placeholder="e.g. Web Development Cohort" required /></div>
          <button className="tn-btn tn-btn-teal" disabled={busy}>Create program</button>
        </form>

        <form className="tn-card" onSubmit={(e) => { e.preventDefault(); run(() => createMentor(mentorData, token), 'Mentor created. Share the email and password with them.', () => setMentorData({ name: '', email: '', password: '' })); }}>
          <h2 className="tn-title tn-h3">2. Onboard a mentor</h2>
          <div className="tn-field"><label htmlFor="mn">Name</label>
            <input id="mn" className="tn-input" value={mentorData.name} onChange={(e) => setMentorData({ ...mentorData, name: e.target.value })} required /></div>
          <div className="tn-field"><label htmlFor="me">Email</label>
            <input id="me" className="tn-input" type="email" value={mentorData.email} onChange={(e) => setMentorData({ ...mentorData, email: e.target.value })} required /></div>
          <div className="tn-field"><label htmlFor="mp">Login password</label>
            <input id="mp" className="tn-input" type="text" value={mentorData.password} onChange={(e) => setMentorData({ ...mentorData, password: e.target.value })} required minLength={6} /></div>
          <button className="tn-btn tn-btn-teal" disabled={busy}>Create mentor</button>
        </form>
      </div>

      <section style={{ marginTop: 28 }}>
        <h2 className="tn-title tn-h2" style={{ marginBottom: 14 }}>3. Assign mentors to programs</h2>
        {programs.length === 0 ? <div className="tn-card tn-empty">No programs yet. Create one above.</div> : (
          <div className="tn-table-wrap">
            <table className="tn-table">
              <thead><tr><th>Program</th><th>Mentors</th><th>Add a mentor</th></tr></thead>
              <tbody>
                {programs.map((p) => {
                  const assignedIds = new Set((p.mentors || []).map((m) => m._id));
                  const options = mentors.filter((m) => !assignedIds.has(m._id));
                  return (
                    <tr key={p._id}>
                      <td><strong>{p.name}</strong></td>
                      <td>{(p.mentors || []).length ? (p.mentors).map((m) => <span key={m._id} className="tn-chip tn-chip-teal" style={{ marginRight: 6 }}>{m.name}</span>) : <span className="tn-muted">none yet</span>}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <select className="tn-select" value={assign[p._id] || ''} onChange={(e) => setAssign({ ...assign, [p._id]: e.target.value })} aria-label={`Mentor for ${p.name}`}>
                            <option value="">Choose mentor</option>
                            {options.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
                          </select>
                          <button className="tn-btn tn-btn-sm" disabled={busy || !assign[p._id]}
                            onClick={() => run(() => addMentorToProgram(p._id, assign[p._id], token), 'Mentor assigned.', () => setAssign({ ...assign, [p._id]: '' }))}>Assign</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 className="tn-title tn-h2" style={{ marginBottom: 14 }}>Mentors</h2>
        {mentors.length === 0 ? <div className="tn-card tn-empty">No mentors yet.</div> : (
          <div className="tn-table-wrap">
            <table className="tn-table">
              <thead><tr><th>Name</th><th>Email</th><th>Programs</th></tr></thead>
              <tbody>{mentors.map((m) => (
                <tr key={m._id}><td><strong>{m.name}</strong></td><td>{m.email}</td>
                  <td>{(m.programs || []).map((p) => p.name).join(', ') || <span className="tn-muted">none</span>}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
