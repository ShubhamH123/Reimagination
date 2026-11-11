'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Empty, Field, Icon, Modal, initials } from '../ui';
import { useToast } from '../Toast';

function CredentialsModal({ creds, onClose }) {
  const toast = useToast();
  const text = `TechNeeds login\nEnrollment number: ${creds.enrollmentNumber}\nPassword: ${creds.password}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); toast.success('Credentials copied'); } catch { toast.error('Could not copy — select and copy manually'); }
  };
  return (
    <Modal title={creds.title} onClose={onClose} width={460}>
      <div className="tn-stack">
        <p className="tn-muted">Share these with <strong>{creds.name}</strong> now. The password is shown only once and is stored hashed.</p>
        <div className="tn-card tn-card--flat" style={{ background: '#f8f9ff' }}>
          <div className="tn-muted" style={{ fontSize: '.78rem' }}>Enrollment number</div>
          <div className="tn-mono" style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '.7rem' }}>{creds.enrollmentNumber}</div>
          <div className="tn-muted" style={{ fontSize: '.78rem' }}>Temporary password</div>
          <div className="tn-mono" style={{ fontSize: '1.2rem', fontWeight: 700 }}>{creds.password}</div>
        </div>
        <button className="tn-btn tn-btn--primary" onClick={copy}><Icon name="fa-copy" /> Copy credentials</button>
      </div>
    </Modal>
  );
}

export default function MenteesPanel({ programId, mentees, refresh }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', enrollmentNumber: '' });
  const [busy, setBusy] = useState(false);
  const [creds, setCreds] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { mentee, tempPassword } = await api.addMentee({ ...form, programId });
      setCreds({ title: 'Mentee added 🎉', name: mentee.name, enrollmentNumber: mentee.enrollmentNumber, password: tempPassword });
      setForm({ name: '', email: '', enrollmentNumber: '' });
      refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const reset = async (m) => {
    if (!window.confirm(`Generate a new password for ${m.name}? The old one will stop working.`)) return;
    try {
      const { tempPassword } = await api.resetMenteePassword(m._id);
      setCreds({ title: 'Password reset', name: m.name, enrollmentNumber: m.enrollmentNumber, password: tempPassword });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <div className="tn-card">
        <div className="tn-card-head"><h2>Add a mentee</h2><span className="tn-chip tn-chip--teal"><Icon name="fa-wand-magic-sparkles" /> Credentials auto-generated</span></div>
        <form onSubmit={add}>
          <div className="tn-form-grid">
            <Field label="Full name"><input className="tn-input" required value={form.name} onChange={set('name')} placeholder="Riya Verma" /></Field>
            <Field label="Email"><input className="tn-input" type="email" required value={form.email} onChange={set('email')} placeholder="riya@example.com" /></Field>
            <Field label="Enrollment number (optional)" className="tn-span-2"><input className="tn-input" value={form.enrollmentNumber} onChange={set('enrollmentNumber')} placeholder="Leave blank to auto-generate, e.g. TN20261234" /></Field>
          </div>
          <button className="tn-btn tn-btn--primary" style={{ marginTop: '1rem' }} disabled={busy}>{busy ? 'Adding…' : <><Icon name="fa-user-plus" /> Add mentee</>}</button>
        </form>
      </div>

      <div className="tn-card">
        <div className="tn-card-head"><h2>Mentees ({mentees.length})</h2></div>
        {mentees.length === 0 ? (
          <Empty icon="fa-users" title="No mentees yet">Add your first mentee above and share their credentials.</Empty>
        ) : (
          <div className="tn-table-wrap">
            <table className="tn-table">
              <thead><tr><th>Mentee</th><th>Enrollment</th><th>Streak</th><th>Done</th><th>Points</th><th /></tr></thead>
              <tbody>
                {mentees.map((m) => {
                  const points = m.totalScore ?? (m.completedResources || []).reduce((s, c) => s + (c.score || 0), 0);
                  return (
                    <tr key={m._id}>
                      <td>
                        <div className="tn-row" style={{ flexWrap: 'nowrap' }}>
                          <span className="tn-chip" style={{ width: 34, height: 34, justifyContent: 'center', borderRadius: 12 }}>{initials(m.name)}</span>
                          <div><strong>{m.name}</strong><div className="tn-muted" style={{ fontSize: '.78rem' }}>{m.email}</div></div>
                        </div>
                      </td>
                      <td className="tn-mono">{m.enrollmentNumber}</td>
                      <td><span className="tn-chip tn-chip--coral"><Icon name="fa-fire" /> {m.streak || 0}d</span></td>
                      <td>{(m.completedResources || []).length}</td>
                      <td><strong>{points}</strong></td>
                      <td style={{ textAlign: 'right' }}><button className="tn-btn tn-btn--ghost tn-btn--sm" onClick={() => reset(m)}><Icon name="fa-key" /> Reset password</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creds && <CredentialsModal creds={creds} onClose={() => setCreds(null)} />}
    </>
  );
}
