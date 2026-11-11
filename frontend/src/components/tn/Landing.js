'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { startDemo } from '@/lib/demoEntry';
import Avatar from './Avatar';
import { Icon } from './ui';

const ROLES = [
  { icon: 'fa-user-shield', grad: 'var(--tn-grad-warm)', title: 'Admins', points: ['Spin up programs and cohorts', 'Onboard mentors with secure logins', 'Assign mentors to programs in one click'] },
  { icon: 'fa-chalkboard-user', grad: 'var(--tn-grad-cool)', title: 'Mentors', points: ['Add mentees — credentials auto-generated', 'Publish videos, quizzes and projects', 'Set deadlines, scores and review submissions'] },
  { icon: 'fa-graduation-cap', grad: 'var(--tn-grad)', title: 'Mentees', points: ['One dashboard for everything due', 'Quizzes, projects and instant scores', 'Compete on a live leaderboard'] }
];

const STEPS = [
  ['Admin creates a program', 'Set up the cohort and bring mentors on board.'],
  ['Mentor builds the curriculum', 'Add mentees and publish resources with deadlines and max scores.'],
  ['Mentees learn and earn', 'Watch, quiz, ship projects — scores land on the leaderboard in real time.'],
  ['AI shapes the journey', 'Every learner gets a living profile with badges, insights and next steps.']
];

export default function Landing() {
  const router = useRouter();
  const tryDemo = (role, href) => { startDemo(role); router.push(href); };

  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="tn-hero">
        <div className="tn-container tn-hero-grid">
          <div>
            <div className="tn-pill"><b>NEW</b> AI-generated learner profiles</div>
            <h1>Learn together.<br /><span className="tn-grad-text">Grow faster.</span></h1>
            <p className="tn-lead">TechNeeds IGDTUW brings mentors and mentees onto one friendly platform — structured cohorts, quizzes, projects, a live leaderboard and an AI profile that celebrates every win.</p>
            <div className="tn-row">
              <button className="tn-btn tn-btn--primary" style={{ padding: '1rem 1.6rem' }} onClick={() => tryDemo('mentee', '/dashboard')}><Icon name="fa-wand-magic-sparkles" /> Explore the live demo</button>
              <Link href="/login" className="tn-btn tn-btn--ghost" style={{ padding: '1rem 1.6rem' }}>Sign in</Link>
            </div>
            <div className="tn-row" style={{ marginTop: '1.6rem', gap: '1.4rem' }}>
              {[['3', 'role dashboards'], ['AI', 'profile & badges'], ['Live', 'leaderboard']].map(([v, l]) => (
                <div key={l}><div style={{ fontWeight: 800, fontSize: '1.4rem' }} className="tn-grad-text">{v}</div><div className="tn-muted" style={{ fontSize: '.8rem', fontWeight: 600 }}>{l}</div></div>
              ))}
            </div>
          </div>

          <div className="tn-hero-visual" aria-hidden="true">
            <div className="tn-float" style={{ top: 0, left: '2%', width: 290 }}>
              <div className="tn-row" style={{ flexWrap: 'nowrap' }}>
                <Avatar seed="Riya Verma" hue={262} accessory="headphones" mood="happy" size={64} />
                <div><strong>Riya Verma</strong><div className="tn-muted" style={{ fontSize: '.8rem' }}>Sharp Thinker · Lv 3</div><span className="tn-chip tn-chip--coral" style={{ marginTop: 4 }}><Icon name="fa-fire" /> 6-day streak</span></div>
              </div>
              <div className="tn-progress" style={{ marginTop: '.9rem' }}><span style={{ width: '72%' }} /></div>
            </div>
            <div className="tn-float" style={{ top: 120, right: 0, width: 250 }}>
              <div className="tn-eyebrow" style={{ marginBottom: '.5rem' }}>Leaderboard</div>
              {[['1', 'Ishita G.', 580], ['2', 'Riya V.', 504], ['3', 'Meera N.', 403]].map(([r, n, p]) => (
                <div key={r} className="tn-row tn-spread" style={{ padding: '.3rem 0', flexWrap: 'nowrap' }}><span><b>#{r}</b> {n}</span><strong>{p}</strong></div>
              ))}
            </div>
            <div className="tn-float" style={{ top: 300, left: '10%', width: 310 }}>
              <div className="tn-eyebrow" style={{ marginBottom: '.6rem' }}>Badges unlocked</div>
              <div className="tn-row" style={{ gap: '.5rem' }}>
                {['fa-fire', 'fa-bolt', 'fa-rocket', 'fa-ranking-star'].map((ic, i) => (
                  <div key={ic} className="tn-badge-icon" style={{ width: 46, height: 46, fontSize: '1.1rem', background: ['var(--tn-grad-warm)', 'var(--tn-grad)', 'var(--tn-grad-cool)', 'var(--tn-grad)'][i] }}><Icon name={ic} /></div>
                ))}
              </div>
              <div className="tn-muted" style={{ fontSize: '.78rem', marginTop: '.6rem' }}>“Your strongest area is quizzes — you&apos;re 40 points from #2.”</div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- roles ---------- */}
      <section className="tn-section">
        <div className="tn-container">
          <div className="tn-section-head">
            <span className="tn-eyebrow">One platform, three roles</span>
            <h2>Everyone gets exactly the tools they need</h2>
            <p className="tn-muted">Dedicated dashboards and permissions keep the program organised from the first mentor to the last mentee.</p>
          </div>
          <div className="tn-grid tn-grid--3">
            {ROLES.map((r) => (
              <div key={r.title} className="tn-card tn-card--lift tn-role-card">
                <div className="tn-feature-icon" style={{ background: r.grad }}><Icon name={r.icon} /></div>
                <h3>{r.title}</h3>
                <ul style={{ listStyle: 'none', display: 'grid', gap: '.55rem' }}>
                  {r.points.map((p) => <li key={p} className="tn-row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start', gap: '.6rem', color: 'var(--tn-ink-2)' }}><Icon name="fa-circle-check" className="tn-grad-text" /> {p}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- AI profile showcase ---------- */}
      <section className="tn-section">
        <div className="tn-container">
          <div className="tn-card tn-hero-profile" style={{ padding: '2.6rem' }}>
            <div className="tn-profile-grid" style={{ gap: '2.4rem' }}>
              <div className="tn-avatar-wrap"><Avatar seed="Ishita Gupta" hue={168} accessory="cap" mood="happy" size={150} /></div>
              <div style={{ flex: 1, minWidth: 260 }}>
                <span className="tn-ai-spark"><Icon name="fa-wand-magic-sparkles" /> AI profile</span>
                <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.3rem)', fontWeight: 800, margin: '.6rem 0' }}>A profile that grows with every win</h2>
                <p style={{ opacity: .92, maxWidth: 560 }}>Scores, streaks, leaderboard standing and interest tags become a personalised avatar, skill badges, a written performance summary and the next resources worth your time.</p>
                <div className="tn-row" style={{ marginTop: '1rem' }}>
                  {['Dynamic avatar', 'Skill badges', 'Performance summary', 'Smart recommendations'].map((t) => <span key={t} className="tn-chip"><Icon name="fa-check" /> {t}</span>)}
                </div>
                <button className="tn-btn" style={{ background: '#fff', color: 'var(--tn-brand)', marginTop: '1.4rem' }} onClick={() => tryDemo('mentee', '/profile')}>See a sample profile <Icon name="fa-arrow-right" /></button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- how it works ---------- */}
      <section className="tn-section">
        <div className="tn-container">
          <div className="tn-section-head"><span className="tn-eyebrow">How it works</span><h2>From cohort to certificate-worthy progress</h2></div>
          <div className="tn-grid tn-grid--2">
            {STEPS.map(([t, d], i) => (
              <div key={t} className="tn-card tn-step">
                <div className="tn-step-num">{i + 1}</div>
                <div><h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{t}</h3><p className="tn-muted">{d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="tn-section" style={{ paddingBottom: '5rem' }}>
        <div className="tn-container">
          <div className="tn-cta">
            <h2>Try every role in under a minute</h2>
            <p style={{ opacity: .9, margin: '.6rem auto 1.6rem', maxWidth: 520 }}>No sign-up needed. Jump into a fully working demo with sample cohorts, quizzes and a live leaderboard.</p>
            <div className="tn-row" style={{ justifyContent: 'center' }}>
              <button className="tn-btn" style={{ background: '#fff', color: 'var(--tn-brand)' }} onClick={() => tryDemo('mentee', '/dashboard')}>Mentee demo</button>
              <button className="tn-btn" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }} onClick={() => tryDemo('mentor', '/mentor')}>Mentor demo</button>
              <button className="tn-btn" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }} onClick={() => tryDemo('admin', '/admin')}>Admin demo</button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
