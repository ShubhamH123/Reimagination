'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { startDemo } from '@/lib/demoEntry';
import { Icon } from '@/components/tn/ui';

const ROLES = [
  { role: 'mentee', href: '/mentee', icon: 'fa-graduation-cap', grad: 'var(--tn-grad)', title: 'Mentee', desc: 'Track your learning, take quizzes, submit projects and climb the leaderboard.' },
  { role: 'mentor', href: '/mentor', icon: 'fa-chalkboard-user', grad: 'var(--tn-grad-cool)', title: 'Mentor', desc: 'Onboard mentees, publish resources with deadlines and review project submissions.' },
  { role: 'admin', href: '/admin', icon: 'fa-user-shield', grad: 'var(--tn-grad-warm)', title: 'Admin', desc: 'Create programs and cohorts, onboard mentors and manage access.' }
];

export default function LoginChooser() {
  const router = useRouter();
  const demo = (role, href) => { startDemo(role); router.push(role === 'mentee' ? '/dashboard' : href); };

  return (
    <div className="tn-container tn-page">
      <div className="tn-section-head" style={{ marginTop: '1.5rem' }}>
        <span className="tn-eyebrow">Welcome</span>
        <h1 style={{ fontSize: 'clamp(1.9rem,4vw,2.8rem)', fontWeight: 800 }}>Who&apos;s signing in?</h1>
        <p className="tn-muted">Pick your role to continue — or try any of them instantly with demo data.</p>
      </div>
      <div className="tn-grid tn-grid--3">
        {ROLES.map((r) => (
          <div key={r.role} className="tn-card tn-card--lift tn-role-card">
            <div className="tn-feature-icon" style={{ background: r.grad }}><Icon name={r.icon} /></div>
            <h3>{r.title}</h3>
            <p className="tn-muted" style={{ flex: 1 }}>{r.desc}</p>
            <Link href={r.href} className="tn-btn tn-btn--primary tn-btn--block" style={{ color: '#fff' }}>Sign in as {r.title.toLowerCase()}</Link>
            <button className="tn-btn tn-btn--soft tn-btn--block" onClick={() => demo(r.role, r.href)}><Icon name="fa-wand-magic-sparkles" /> Try the demo</button>
          </div>
        ))}
      </div>
    </div>
  );
}
