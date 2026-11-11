'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { clearSession, exitDemo, getToken, setToken } from '@/lib/session';
import { startDemo } from '@/lib/demoEntry';
import AuthCard from '../AuthCard';
import Avatar from '../Avatar';
import Shell from '../Shell';
import { Empty, Field, Icon, SkeletonBlocks, Spinner, StatCard } from '../ui';
import { useToast } from '../Toast';

const randomPassword = () => Math.random().toString(36).slice(-6) + Math.random().toString(36).slice(-4).toUpperCase();

function ProgramCard({ program, mentors, onAssign }) {
  const [mentorId, setMentorId] = useState('');
  const assigned = new Set((program.mentors || []).map((m) => String(m._id || m)));
  const available = mentors.filter((m) => !assigned.has(String(m._id)));

  return (
    <div className="tn-card tn-card--lift">
      <div className="tn-row tn-spread">
        <h3 style={{ fontWeight: 800 }}>{program.name}</h3>
        <span className="tn-chip tn-chip--teal"><Icon name="fa-chalkboard-user" /> {(program.mentors || []).length} mentors</span>
      </div>
      <div className="tn-row" style={{ margin: '.9rem 0', minHeight: 34 }}>
        {(program.mentors || []).length === 0 && <span className="tn-muted" style={{ fontSize: '.85rem' }}>No mentors assigned yet</span>}
        {(program.mentors || []).map((m) => <span key={m._id || m} className="tn-chip">{m.name || 'Mentor'}</span>)}
      </div>
      <div className="tn-row" style={{ flexWrap: 'nowrap' }}>
        <select className="tn-select" value={mentorId} onChange={(e) => setMentorId(e.target.value)} aria-label={`Mentor to add to ${program.name}`}>
          <option value="">{available.length ? 'Select a mentor…' : 'All mentors assigned'}</option>
          {available.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
        </select>
        <button className="tn-btn tn-btn--primary tn-btn--sm" disabled={!mentorId} onClick={() => { onAssign(program._id, mentorId); setMentorId(''); }}>Assign</button>
      </div>
    </div>
  );
}

export default function AdminApp() {
  const router = useRouter();
  const toast = useToast();
  const [authed, setAuthed] = useState(null);
  const [programs, setPrograms] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [tab, setTab] = useState('programs');
  const [programName, setProgramName] = useState('');
  const [mentorForm, setMentorForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => setAuthed(!!getToken('admin')), []);

  const load = useCallback(async () => {
    try {
      const [p, m] = await Promise.all([api.getPrograms(), api.getMentors()]);
      setPrograms(p);
      setMentors(m);
    } catch (e) {
      if (e.status === 401 || e.status === 403) { clearSession('admin'); setAuthed(false); return; }
      setPrograms([]);
      toast.error(e.message);
    }
  }, [toast]);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  const run = async (fn, okMsg) => {
    setBusy(true);
    try {
      await fn();
      toast.success(okMsg);
      await load();
    } catch (e) {
      if (e.status === 401 || e.status === 403) { clearSession('admin'); setAuthed(false); }
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (authed === null) return <Spinner />;
  if (!authed) {
    return (
      <AuthCard
        icon="fa-user-shield"
        title="Admin login"
        subtitle="Restricted area. Manage programs, cohorts and mentors."
        fields={[{ name: 'email', label: 'Admin email', type: 'email' }, { name: 'password', label: 'Password', password: true }]}
        hint="Credentials come from ADMIN_EMAIL / ADMIN_PASSWORD in backend/.env."
        onSubmit={async ({ email, password }) => {
          const { token } = await api.adminLogin(email, password);
          setToken('admin', token);
          setAuthed(true);
        }}
        onDemo={() => { startDemo('admin'); setAuthed(true); router.refresh(); }}
      />
    );
  }

  const tabs = [
    { id: 'programs', label: 'Programs', icon: 'fa-diagram-project' },
    { id: 'mentors', label: 'Mentors', icon: 'fa-chalkboard-user' }
  ];
  const logout = () => { clearSession('admin'); exitDemo(); setAuthed(false); };

  return (
    <Shell user={{ name: 'Administrator', sub: 'Full access', avatar: <Avatar seed="TechNeeds Admin" hue={20} accessory="cap" size={46} /> }} tabs={tabs} active={tab} onTab={setTab} onLogout={logout}>
      <div><h1 className="tn-title">Admin console</h1><p className="tn-muted">Create cohorts, onboard mentors and connect the two.</p></div>

      <div className="tn-grid tn-grid--3">
        <StatCard icon="fa-diagram-project" label="Programs" value={programs?.length ?? '–'} tone="brand" />
        <StatCard icon="fa-chalkboard-user" label="Mentors" value={mentors.length} tone="teal" />
        <StatCard icon="fa-link" label="Assignments" value={(programs || []).reduce((s, p) => s + (p.mentors || []).length, 0)} tone="coral" />
      </div>

      {tab === 'programs' && (
        <>
          <div className="tn-card">
            <div className="tn-card-head"><h2>Create a program</h2></div>
            <form className="tn-row" style={{ flexWrap: 'nowrap' }} onSubmit={(e) => { e.preventDefault(); run(async () => { await api.createProgram(programName.trim()); setProgramName(''); }, 'Program created'); }}>
              <input className="tn-input" required value={programName} onChange={(e) => setProgramName(e.target.value)} placeholder="e.g. Winter Web Dev Cohort" />
              <button className="tn-btn tn-btn--primary" disabled={busy}><Icon name="fa-plus" /> Create</button>
            </form>
          </div>
          {programs === null ? <SkeletonBlocks count={2} height={130} /> : programs.length === 0 ? (
            <div className="tn-card"><Empty icon="fa-diagram-project" title="No programs yet">Create your first mentorship program above.</Empty></div>
          ) : (
            <div className="tn-grid tn-grid--2">
              {programs.map((p) => <ProgramCard key={p._id} program={p} mentors={mentors} onAssign={(pid, mid) => run(() => api.assignMentor(pid, mid), 'Mentor assigned')} />)}
            </div>
          )}
        </>
      )}

      {tab === 'mentors' && (
        <>
          <div className="tn-card">
            <div className="tn-card-head"><h2>Onboard a mentor</h2></div>
            <form onSubmit={(e) => { e.preventDefault(); run(async () => { await api.createMentor(mentorForm); setMentorForm({ name: '', email: '', password: '' }); }, 'Mentor created — share their login securely'); }}>
              <div className="tn-form-grid">
                <Field label="Full name"><input className="tn-input" required value={mentorForm.name} onChange={(e) => setMentorForm({ ...mentorForm, name: e.target.value })} /></Field>
                <Field label="Email"><input className="tn-input" type="email" required value={mentorForm.email} onChange={(e) => setMentorForm({ ...mentorForm, email: e.target.value })} /></Field>
                <Field label="Login password" className="tn-span-2">
                  <div className="tn-row" style={{ flexWrap: 'nowrap' }}>
                    <input className="tn-input tn-mono" required minLength={6} value={mentorForm.password} onChange={(e) => setMentorForm({ ...mentorForm, password: e.target.value })} placeholder="Min. 6 characters" />
                    <button type="button" className="tn-btn tn-btn--soft" onClick={() => setMentorForm({ ...mentorForm, password: randomPassword() })}><Icon name="fa-wand-magic-sparkles" /> Generate</button>
                  </div>
                </Field>
              </div>
              <button className="tn-btn tn-btn--primary" style={{ marginTop: '1rem' }} disabled={busy}><Icon name="fa-user-plus" /> Create mentor</button>
            </form>
          </div>
          <div className="tn-card">
            <div className="tn-card-head"><h2>All mentors ({mentors.length})</h2></div>
            {mentors.length === 0 ? <Empty icon="fa-chalkboard-user" title="No mentors yet">Create one above, then assign them to a program.</Empty> : (
              <div className="tn-table-wrap"><table className="tn-table">
                <thead><tr><th>Mentor</th><th>Email</th><th>Programs</th></tr></thead>
                <tbody>{mentors.map((m) => (
                  <tr key={m._id}>
                    <td><div className="tn-row" style={{ flexWrap: 'nowrap' }}><Avatar seed={m.name} hue={168} size={34} /><strong>{m.name}</strong></div></td>
                    <td>{m.email}</td>
                    <td><span className="tn-chip">{(m.programs || []).length} assigned</span></td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </div>
        </>
      )}
    </Shell>
  );
}
