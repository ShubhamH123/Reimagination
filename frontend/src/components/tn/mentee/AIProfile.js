'use client';
import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { api } from '@/lib/api';
import { INTEREST_OPTIONS, buildProfile } from '@/lib/aiProfile';
import Avatar from '../Avatar';
import { Empty, Icon, Progress, TYPE_ICON } from '../ui';
import { useToast } from '../Toast';

/** Reveals text word by word so the summary feels generated. */
function useTypewriter(text, speed = 18) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    if (!text) { setShown(''); return undefined; }
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setShown(text); return undefined; }
    let i = 0;
    const t = setInterval(() => {
      i += 3;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return shown;
}

function pointsOverTime(completed) {
  const sorted = [...completed].filter((c) => c.completedOn).sort((a, b) => new Date(a.completedOn) - new Date(b.completedOn));
  let total = 0;
  return sorted.map((c) => {
    total += c.score || 0;
    return { day: new Date(c.completedOn).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), points: total };
  });
}

export default function AIProfile({ data, leaderboard, reload, onGoLearn }) {
  const toast = useToast();
  const profile = useMemo(() => buildProfile(data, { leaderboard }), [data, leaderboard]);
  const [selected, setSelected] = useState(data.interests || []);
  const [saving, setSaving] = useState(false);
  const [llm, setLlm] = useState(null); // { summary } when the backend has an LLM key
  const [thinking, setThinking] = useState(false);

  useEffect(() => setSelected(data.interests || []), [data.interests]);

  const fetchInsight = async () => {
    setThinking(true);
    try {
      const res = await api.getAiSummary(profile.llmStats);
      setLlm(res.source === 'llm' && res.summary ? res.summary : null);
    } catch {
      setLlm(null);
    } finally {
      setThinking(false);
    }
  };
  // Ask the backend for an LLM-written summary once per profile state; the rules summary is the fallback.
  useEffect(() => { fetchInsight(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [data.totalScore, data.streak, data.interests?.length]);

  const summary = llm || profile.summary;
  const typed = useTypewriter(summary);
  const dirty = JSON.stringify([...selected].sort()) !== JSON.stringify([...(data.interests || [])].sort());

  const toggle = (tag) => {
    if (selected.includes(tag)) return setSelected(selected.filter((t) => t !== tag));
    if (selected.length >= 5) return toast.error('Pick up to 5 interests');
    return setSelected([...selected, tag]);
  };
  const saveInterests = async () => {
    setSaving(true);
    try {
      await api.updateInterests(selected);
      toast.success('Interests saved — your profile just updated ✨');
      await reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const copyCard = async () => {
    const text = `${data.name} · ${profile.persona.title}\nRank #${data.rank ?? '–'} · ${data.totalScore} pts · ${data.streak}-day streak\nBadges: ${profile.badges.filter((b) => b.earned).map((b) => b.label).join(', ') || 'none yet'}\n${summary}`;
    try { await navigator.clipboard.writeText(text); toast.success('Profile summary copied'); } catch { toast.error('Could not copy'); }
  };

  const earned = profile.badges.filter((b) => b.earned);
  const locked = profile.badges.filter((b) => !b.earned);
  const trend = pointsOverTime(data.completedResources || []);

  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="tn-card tn-hero-profile">
        <div className="tn-profile-grid">
          <div className="tn-avatar-wrap"><Avatar {...profile.avatar} size={132} /></div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <span className="tn-ai-spark"><Icon name="fa-wand-magic-sparkles" /> AI-generated profile</span>
            <h1 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 800, margin: '.5rem 0 .1rem' }}>{data.name}</h1>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{profile.persona.title}</div>
            <div style={{ opacity: .85 }}>{profile.persona.tagline}</div>
            <div className="tn-row" style={{ marginTop: '.9rem' }}>
              <span className="tn-chip"><Icon name="fa-ranking-star" /> Rank #{data.rank ?? '–'}</span>
              <span className="tn-chip"><Icon name="fa-star" /> {data.totalScore} pts</span>
              <span className="tn-chip"><Icon name="fa-fire" /> {data.streak}-day streak</span>
              <span className="tn-chip"><Icon name="fa-medal" /> {profile.earnedCount} badges</span>
            </div>
          </div>
          <button className="tn-btn tn-btn--sm" style={{ background: 'rgba(255,255,255,.22)', color: '#fff' }} onClick={copyCard}><Icon name="fa-copy" /> Copy summary</button>
        </div>
      </section>

      {/* ---------- AI insight ---------- */}
      <section className="tn-card">
        <div className="tn-card-head">
          <h2><Icon name="fa-brain" className="tn-grad-text" /> Your performance summary</h2>
          <div className="tn-row">
            <span className="tn-chip tn-chip--gray">{llm ? 'Written by an LLM' : 'Generated from your activity'}</span>
            <button className="tn-btn tn-btn--soft tn-btn--sm" onClick={fetchInsight} disabled={thinking}><Icon name={thinking ? 'fa-spinner fa-spin' : 'fa-rotate'} /> Refresh</button>
          </div>
        </div>
        <p style={{ fontSize: '1.05rem', color: 'var(--tn-ink-2)', minHeight: '4.6rem' }} className={typed.length < summary.length ? 'tn-typing' : ''}>{typed}</p>
        {profile.nextRank && (
          <div className="tn-hint" style={{ marginTop: '.8rem' }}><Icon name="fa-bullseye" /> <strong>{profile.nextRank.gap} points</strong> separate you from rank #{profile.nextRank.target} ({profile.nextRank.name}).</div>
        )}
      </section>

      <div className="tn-grid tn-grid--2">
        {/* ---------- radar ---------- */}
        <section className="tn-card">
          <div className="tn-card-head"><h3>Skill radar</h3></div>
          <div style={{ width: '100%', height: 270 }}>
            <ResponsiveContainer>
              <RadarChart data={profile.radar} outerRadius="72%">
                <PolarGrid stroke="#dfe4f4" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: '#3b4570', fontSize: 12, fontWeight: 600 }} />
                <Radar dataKey="value" stroke="#5b7cff" strokeWidth={2.5} fill="#8a63ff" fillOpacity={0.3} />
                <Tooltip formatter={(v) => [`${v}/100`, 'Score']} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ---------- skills ---------- */}
        <section className="tn-card">
          <div className="tn-card-head"><h3>Skill levels</h3></div>
          <div className="tn-stack" style={{ gap: '1.15rem' }}>
            {profile.skills.map((s) => (
              <div key={s.key} className="tn-skill">
                <div className="tn-skill-top">
                  <span><Icon name={s.icon} className="tn-grad-text" /> {s.label}</span>
                  <span className="tn-chip">Lv {s.level}</span>
                </div>
                <Progress value={s.progress} tone={s.key === 'builder' ? 'teal' : s.key === 'thinker' ? '' : 'warm'} />
                <div className="tn-muted" style={{ fontSize: '.78rem' }}>{s.detail} · {s.toNext} XP to level {s.level + 1}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ---------- interests ---------- */}
      <section className="tn-card">
        <div className="tn-card-head">
          <div>
            <h3>Your interests</h3>
            <div className="tn-muted" style={{ fontSize: '.85rem' }}>Pick up to 5. They shape your skill badges and recommendations.</div>
          </div>
          <button className="tn-btn tn-btn--primary tn-btn--sm" disabled={!dirty || saving} onClick={saveInterests}>{saving ? 'Saving…' : 'Save interests'}</button>
        </div>
        <div className="tn-row">
          {INTEREST_OPTIONS.map((tag) => <button key={tag} className="tn-tag" aria-pressed={selected.includes(tag)} onClick={() => toggle(tag)}>{tag}</button>)}
        </div>
      </section>

      {/* ---------- badges ---------- */}
      <section className="tn-card">
        <div className="tn-card-head"><h3>Skill badges</h3><span className="tn-chip tn-chip--gold">{earned.length} earned · {locked.length} to unlock</span></div>
        <div className="tn-grid tn-grid--4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
          {[...earned, ...locked].map((b) => (
            <div key={b.id} className={`tn-badge ${b.earned ? '' : 'tn-badge--locked'}`} title={b.hint}>
              <div className="tn-badge-icon" style={b.earned && b.id.startsWith('interest') ? { background: 'var(--tn-grad-warm)' } : undefined}><Icon name={b.earned ? b.icon : 'fa-lock'} /></div>
              <strong>{b.label}</strong>
              <small>{b.hint}</small>
            </div>
          ))}
        </div>
      </section>

      <div className="tn-grid tn-grid--2">
        {/* ---------- recommendations ---------- */}
        <section className="tn-card">
          <div className="tn-card-head"><h3>Recommended next</h3></div>
          {profile.recommendations.length === 0 ? (
            <Empty icon="fa-champagne-glasses" title="Nothing pending!">You’ve finished everything available. New picks appear when your mentor posts more.</Empty>
          ) : (
            <div className="tn-stack">
              {profile.recommendations.map((r, i) => (
                <div key={r.id} className="tn-rec">
                  <div className="tn-rec-num">{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <strong>{r.title}</strong>
                    <div className="tn-muted" style={{ fontSize: '.82rem' }}><Icon name={TYPE_ICON[r.type]} /> {r.reason}</div>
                  </div>
                  <span className="tn-chip tn-chip--gold">+{r.points}</span>
                </div>
              ))}
              <button className="tn-btn tn-btn--soft" onClick={onGoLearn}>Go to my resources <Icon name="fa-arrow-right" /></button>
            </div>
          )}
        </section>

        {/* ---------- points trend ---------- */}
        <section className="tn-card">
          <div className="tn-card-head"><h3>Points over time</h3></div>
          {trend.length < 2 ? (
            <Empty icon="fa-chart-line" title="Not enough data yet">Complete a couple of resources to see your growth curve.</Empty>
          ) : (
            <div style={{ width: '100%', height: 230 }}>
              <ResponsiveContainer>
                <AreaChart data={trend} margin={{ left: 0, right: 8, top: 8 }}>
                  <defs><linearGradient id="pts" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5b7cff" stopOpacity={0.4} /><stop offset="1" stopColor="#5b7cff" stopOpacity={0} /></linearGradient></defs>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6f7a99' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [`${v} pts`, 'Total']} />
                  <Area type="monotone" dataKey="points" stroke="#5b7cff" strokeWidth={3} fill="url(#pts)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
