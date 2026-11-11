'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { API_URL } from '../../lib/config';
import Avatar from './Avatar';
import './profile.css';

const SUGGESTED = ['web', 'dsa', 'ml', 'ai', 'app', 'cloud', 'security', 'design', 'java', 'python', 'open source'];

async function api(path, token, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'x-auth-token': token, ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data.error || 'Request failed'); e.status = res.status; throw e; }
  return data;
}

function Narrative({ n, onRefresh, refreshing, generatedAt }) {
  if (!n) return null;
  return (
    <section className="tn-card tn-prof-ai" aria-live="polite">
      <div className="tn-prof-ai-top">
        <span className={`tn-chip ${n.source === 'ai' ? 'tn-chip-gold' : ''}`}>
          <i className={`fa-solid ${n.source === 'ai' ? 'fa-wand-magic-sparkles' : 'fa-chart-simple'}`} />
          {n.source === 'ai' ? 'Written by AI from your activity' : 'Summary from your activity'}
        </span>
        {onRefresh && (
          <button className="tn-btn tn-btn-ghost tn-btn-sm" onClick={onRefresh} disabled={refreshing}>
            <i className={`fa-solid fa-rotate ${refreshing ? 'fa-spin' : ''}`} /> {refreshing ? 'Rewriting…' : 'Rewrite'}
          </button>
        )}
      </div>
      <h2 className="tn-title tn-prof-headline">{n.headline}</h2>
      <p className="tn-prof-summary">{n.summary}</p>
      <div className="tn-prof-cols">
        {n.strengths && n.strengths.length > 0 && (
          <div>
            <h3 className="tn-title tn-h3">What is going well</h3>
            <ul className="tn-prof-list tn-prof-list-good">{n.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
        )}
        <div>
          <h3 className="tn-title tn-h3">Your next steps</h3>
          <ul className="tn-prof-list tn-prof-list-next">{n.nextSteps.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      </div>
      {generatedAt && <p className="tn-muted tn-prof-stamp">Updated {new Date(generatedAt).toLocaleString()}</p>}
    </section>
  );
}

function Badges({ badges }) {
  const earned = badges.filter((b) => b.earned).length;
  return (
    <section className="tn-card">
      <div className="tn-section-head">
        <h2 className="tn-title tn-h2">Badges</h2>
        <span className="tn-chip tn-chip-gold">{earned} of {badges.length} earned</span>
      </div>
      <div className="tn-badges">
        {badges.map((b) => (
          <div key={b.id} className={`tn-badge ${b.earned ? 'is-earned' : ''}`} title={b.description}>
            <span className="tn-badge-icon"><i className={`fa-solid ${b.icon}`} /></span>
            <strong>{b.label}</strong>
            <small>{b.earned ? 'Earned' : b.description}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

function MenteeView({ data, token, reload, refreshing, onRefresh }) {
  const [interests, setInterests] = useState(data.interests || []);
  const [custom, setCustom] = useState('');
  const [saving, setSaving] = useState(false);
  const t = data.totals;

  const save = async (next) => {
    setSaving(true);
    try {
      const res = await api('/api/profile/mentee/interests', token, { method: 'PUT', body: JSON.stringify({ interests: next }) });
      setInterests(res.interests);
      await reload();
    } finally { setSaving(false); }
  };
  const toggle = (tag) => save(interests.includes(tag) ? interests.filter((i) => i !== tag) : [...interests, tag]);
  const addCustom = (e) => {
    e.preventDefault();
    const tag = custom.trim().toLowerCase();
    if (tag && !interests.includes(tag)) save([...interests, tag]);
    setCustom('');
  };

  return (
    <>
      <section className="tn-prof-hero">
        <Avatar seed={data.enrollmentNumber || data.name} name={data.name} level={data.level.index} skills={data.skills} />
        <div className="tn-prof-hero-text">
          <p className="tn-prof-kicker">{data.programs.join(', ') || 'No program yet'}</p>
          <h1 className="tn-title tn-h1">{data.name}</h1>
          <div className="tn-prof-chips">
            <span className="tn-chip tn-chip-gold"><i className="fa-solid fa-layer-group" /> Level {data.level.index}: {data.level.name}</span>
            {t.rank > 0 && <span className="tn-chip"><i className="fa-solid fa-ranking-star" /> Rank {t.rank} of {t.totalMentees}</span>}
            <span className="tn-chip"><i className="fa-solid fa-fire" /> {t.streak}-day streak</span>
          </div>
          <div className="tn-xp" role="progressbar" aria-valuenow={data.level.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to next level">
            <div className="tn-xp-bar"><span style={{ width: `${data.level.progress}%` }} /></div>
            <small>{data.level.nextName ? `${data.level.xp} of ${data.level.nextAt} points to ${data.level.nextName}` : 'Top level reached'}</small>
          </div>
        </div>
      </section>

      <Narrative n={data.narrative} onRefresh={onRefresh} refreshing={refreshing} generatedAt={data.generatedAt} />

      <div className="tn-prof-grid">
        <section className="tn-card">
          <h2 className="tn-title tn-h2">Skill map</h2>
          <p className="tn-muted">Built from what you have finished, your scores and your timing.</p>
          <div className="tn-prof-radar">
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={data.skills} outerRadius="72%">
                <PolarGrid stroke="#e3e0f3" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#1b1740', fontSize: 13, fontWeight: 700 }} />
                <Radar dataKey="value" stroke="#0e8f9c" strokeWidth={2.5} fill="#0e8f9c" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <ul className="tn-prof-skilllist">
            {data.skills.map((s) => <li key={s.skill}><span>{s.skill}</span><strong>{s.value}</strong></li>)}
          </ul>
        </section>

        <section className="tn-card">
          <h2 className="tn-title tn-h2">At a glance</h2>
          <div className="tn-prof-tiles">
            <div><strong>{t.totalScore}</strong><span>points</span></div>
            <div><strong>{t.completed}/{t.assigned}</strong><span>resources done</span></div>
            <div><strong>{t.quizAvg === null ? '–' : `${t.quizAvg}%`}</strong><span>quiz average</span></div>
            <div><strong>{t.onTimeRate}%</strong><span>on time</span></div>
          </div>

          <h3 className="tn-title tn-h3 tn-prof-sub">Up next</h3>
          {data.pending.length === 0 ? (
            <p className="tn-muted">Nothing due. Ask your mentor for more, or revisit a topic you liked.</p>
          ) : (
            <ul className="tn-prof-upnext">
              {data.pending.map((p, i) => (
                <li key={i}>
                  <span><strong>{p.title}</strong> <span className="tn-chip">{p.type}</span></span>
                  <span className={`tn-chip ${p.daysLeft < 0 ? 'tn-chip-coral' : p.daysLeft <= 2 ? 'tn-chip-gold' : 'tn-chip-teal'}`}>
                    {p.daysLeft < 0 ? `${Math.abs(p.daysLeft)}d late` : p.daysLeft === 0 ? 'due today' : `${p.daysLeft}d left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/dashboard" className="tn-btn tn-btn-teal tn-btn-sm tn-prof-go">Open my learning</Link>
        </section>
      </div>

      <Badges badges={data.badges} />

      <section className="tn-card">
        <h2 className="tn-title tn-h2">Your interests</h2>
        <p className="tn-muted">Pick what you want to grow in. Your next steps and write-up adapt to these.</p>
        <div className="tn-interest-row">
          {[...new Set([...SUGGESTED, ...interests])].map((tag) => (
            <button key={tag} type="button" disabled={saving} onClick={() => toggle(tag)}
              className={`tn-interest ${interests.includes(tag) ? 'is-on' : ''}`} aria-pressed={interests.includes(tag)}>
              {tag}
            </button>
          ))}
        </div>
        <form onSubmit={addCustom} className="tn-interest-add">
          <input className="tn-input" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add your own, e.g. robotics" maxLength={24} aria-label="Add an interest" />
          <button className="tn-btn tn-btn-sm" disabled={saving || !custom.trim()}>Add</button>
        </form>
      </section>
    </>
  );
}

function MentorView({ data }) {
  const t = data.totals;
  return (
    <>
      <section className="tn-prof-hero">
        <Avatar seed={data.email || data.name} name={data.name} level={Math.min(5, 1 + Math.floor(t.mentees / 5))}
          skills={[{ value: Math.min(100, t.resources * 10) }, { value: Math.min(100, t.mentees * 10) }, { value: Math.min(100, t.verifiedProjects * 20) }, { value: Math.min(100, t.programs * 50) }, { value: t.pendingVerifications === 0 ? 100 : 30 }]} />
        <div className="tn-prof-hero-text">
          <p className="tn-prof-kicker">Mentor</p>
          <h1 className="tn-title tn-h1">{data.name}</h1>
          <div className="tn-prof-chips">
            {data.programs.map((p) => <span key={p} className="tn-chip tn-chip-teal">{p}</span>)}
            {data.programs.length === 0 && <span className="tn-chip">No program assigned yet</span>}
          </div>
        </div>
      </section>
      <Narrative n={data.narrative} />
      <section className="tn-card">
        <h2 className="tn-title tn-h2">At a glance</h2>
        <div className="tn-prof-tiles">
          <div><strong>{t.mentees}</strong><span>mentees</span></div>
          <div><strong>{t.resources}</strong><span>resources posted</span></div>
          <div><strong>{t.verifiedProjects}</strong><span>projects verified</span></div>
          <div><strong>{t.pendingVerifications}</strong><span>awaiting review</span></div>
        </div>
        <Link href="/mentor" className="tn-btn tn-btn-teal tn-btn-sm tn-prof-go">Open mentor panel</Link>
      </section>
      <Badges badges={data.badges} />
    </>
  );
}

export default function Profile() {
  const router = useRouter();
  const [session, setSession] = useState(undefined); // undefined = checking
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (s, refresh = false) => {
    try {
      const path = s.role === 'mentee' ? `/api/profile/mentee${refresh ? '?refresh=1' : ''}` : '/api/profile/mentor';
      setData(await api(path, s.token));
      setError('');
    } catch (err) {
      if (err.status === 401) {
        localStorage.removeItem(s.role === 'mentee' ? 'menteeToken' : 'token');
        setSession(null);
      } else {
        setError(err.message === 'Failed to fetch' ? `Cannot reach the server at ${API_URL}. Is the backend running?` : err.message);
      }
    }
  }, []);

  useEffect(() => {
    const mentee = localStorage.getItem('menteeToken');
    const mentor = localStorage.getItem('token');
    const s = mentee ? { role: 'mentee', token: mentee } : mentor ? { role: 'mentor', token: mentor } : null;
    setSession(s);
    if (s) load(s);
  }, [load]);

  if (session === undefined) return <div className="tn-spinner" role="status" aria-label="Loading" />;

  if (!session) {
    return (
      <div className="tn-page-narrow">
        <div className="tn-card tn-prof-gate">
          <h1 className="tn-title tn-h2">Sign in to see your profile</h1>
          <p className="tn-muted">Your profile is generated from your own progress: completed resources, scores, streak and leaderboard rank.</p>
          <div className="tn-prof-chips">
            <Link href="/mentee" className="tn-btn tn-btn-gold">Mentee login</Link>
            <Link href="/mentor" className="tn-btn tn-btn-ghost">Mentor login</Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div className="tn-page-narrow"><div className="tn-alert tn-alert-error">{error}</div><button className="tn-btn" onClick={() => load(session)}>Try again</button></div>;
  if (!data) return <div className="tn-spinner" role="status" aria-label="Loading your profile" />;

  return (
    <div className="tn-page tn-prof">
      {session.role === 'mentee' ? (
        <MenteeView data={data} token={session.token}
          reload={() => load(session)}
          refreshing={refreshing}
          onRefresh={async () => { setRefreshing(true); await load(session, true); setRefreshing(false); }} />
      ) : (
        <MentorView data={data} />
      )}
    </div>
  );
}
