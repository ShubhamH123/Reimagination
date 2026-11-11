'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { clearSession, exitDemo, getMentor, getToken, setMentor, setToken } from '@/lib/session';
import { startDemo } from '@/lib/demoEntry';
import AuthCard from '../AuthCard';
import Avatar from '../Avatar';
import Shell from '../Shell';
import { Empty, Spinner, StatCard } from '../ui';
import { useToast } from '../Toast';
import MenteesPanel from './MenteesPanel';
import ResourcesPanel from './ResourcesPanel';
import ReviewsPanel from './ReviewsPanel';

export default function MentorApp() {
  const router = useRouter();
  const toast = useToast();
  const [authed, setAuthed] = useState(null); // null = checking
  const [mentor, setMentorState] = useState(null);
  const [programs, setPrograms] = useState(null);
  const [programId, setProgramId] = useState('');
  const [mentees, setMentees] = useState([]);
  const [resources, setResources] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [tab, setTab] = useState('mentees');

  useEffect(() => {
    setAuthed(!!getToken('mentor'));
    setMentorState(getMentor());
  }, []);

  const fail = useCallback((e) => {
    if (e.status === 401 || e.status === 403) {
      clearSession('mentor');
      setAuthed(false);
      return;
    }
    toast.error(e.message);
  }, [toast]);

  const loadPrograms = useCallback(async () => {
    try {
      const list = await api.getMyPrograms();
      setPrograms(list);
      setProgramId((cur) => cur || list[0]?._id || '');
    } catch (e) { setPrograms([]); fail(e); }
  }, [fail]);

  const loadProgram = useCallback(async () => {
    if (!programId) return;
    try {
      const [m, r] = await Promise.all([api.getProgramMentees(programId), api.getProgramResources(programId)]);
      setMentees(m);
      setResources(r);
    } catch (e) { fail(e); }
  }, [programId, fail]);

  const loadReviews = useCallback(async () => {
    try { setReviews(await api.getUnverified()); } catch (e) { fail(e); }
  }, [fail]);

  useEffect(() => { if (authed) { loadPrograms(); loadReviews(); } }, [authed, loadPrograms, loadReviews]);
  useEffect(() => { if (authed) loadProgram(); }, [authed, loadProgram]);

  const logout = () => { clearSession('mentor'); exitDemo(); setAuthed(false); setPrograms(null); setProgramId(''); };

  if (authed === null) return <Spinner />;

  if (!authed) {
    return (
      <AuthCard
        icon="fa-chalkboard-user"
        title="Mentor login"
        subtitle="Sign in with the credentials your admin created for you."
        fields={[{ name: 'email', label: 'Email', type: 'email', placeholder: 'mentor@example.com' }, { name: 'password', label: 'Password', password: true }]}
        onSubmit={async ({ email, password }) => {
          const { token, mentor: m } = await api.mentorLogin(email, password);
          setToken('mentor', token);
          setMentor(m);
          setMentorState(m);
          setAuthed(true);
          toast.success(`Welcome, ${m.name.split(' ')[0]}!`);
        }}
        onDemo={() => { startDemo('mentor'); setMentorState(getMentor()); setAuthed(true); router.refresh(); }}
      />
    );
  }

  const tabs = [
    { id: 'mentees', label: 'Mentees', icon: 'fa-users' },
    { id: 'resources', label: 'Resources', icon: 'fa-layer-group' },
    { id: 'reviews', label: 'Reviews', icon: 'fa-clipboard-check', count: reviews.length }
  ];
  const name = mentor?.name || 'Mentor';
  const avgPoints = mentees.length ? Math.round(mentees.reduce((s, m) => s + (m.totalScore ?? (m.completedResources || []).reduce((a, c) => a + (c.score || 0), 0)), 0) / mentees.length) : 0;

  return (
    <Shell user={{ name, sub: 'Mentor', avatar: <Avatar seed={name} hue={168} accessory="glasses" size={46} /> }} tabs={tabs} active={tab} onTab={setTab} onLogout={logout}>
      <div className="tn-row tn-spread">
        <div><h1 className="tn-title">Mentor workspace</h1><p className="tn-muted">Manage your cohort, publish learning and review projects.</p></div>
        {programs && programs.length > 0 && (
          <select className="tn-select" style={{ width: 'auto', minWidth: 220 }} value={programId} onChange={(e) => setProgramId(e.target.value)} aria-label="Program">
            {programs.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        )}
      </div>

      {programs === null ? <Spinner /> : programs.length === 0 ? (
        <div className="tn-card"><Empty icon="fa-diagram-project" title="You’re not assigned to a program yet">Ask an admin to add you to a program, then refresh this page.</Empty></div>
      ) : (
        <>
          <div className="tn-grid tn-grid--4">
            <StatCard icon="fa-users" label="Mentees" value={mentees.length} tone="brand" />
            <StatCard icon="fa-layer-group" label="Resources" value={resources.length} tone="teal" />
            <StatCard icon="fa-clipboard-check" label="Awaiting review" value={reviews.length} tone="coral" />
            <StatCard icon="fa-star" label="Avg. points" value={avgPoints} tone="gold" />
          </div>
          {tab === 'mentees' && <MenteesPanel programId={programId} mentees={mentees} refresh={loadProgram} />}
          {tab === 'resources' && <ResourcesPanel programId={programId} resources={resources} refresh={loadProgram} />}
          {tab === 'reviews' && <ReviewsPanel reviews={reviews} refresh={() => { loadReviews(); loadProgram(); }} />}
        </>
      )}
    </Shell>
  );
}
