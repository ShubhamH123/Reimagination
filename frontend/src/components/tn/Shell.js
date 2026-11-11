'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { exitDemo, isDemo } from '@/lib/session';
import { Icon } from './ui';

/**
 * Shared layout for the three role dashboards: a sidebar (tabs + user) and a content column.
 * Collapses into a horizontally scrolling tab bar on small screens.
 */
export default function Shell({ user, tabs, active, onTab, onLogout, children }) {
  const router = useRouter();
  const [demo, setDemo] = useState(false);
  useEffect(() => setDemo(isDemo()), []); // read after mount to avoid a hydration mismatch

  return (
    <div className="tn-container tn-page">
      <div className="tn-shell">
        <aside className="tn-card tn-side">
          <div className="tn-side-user">
            {user.avatar}
            <div>
              <strong>{user.name}</strong>
              <span>{user.sub}</span>
            </div>
          </div>
          <nav className="tn-side-nav" aria-label="Dashboard sections">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => onTab(t.id)} aria-current={active === t.id ? 'page' : undefined}>
                <Icon name={t.icon} /> {t.label}
                {t.count > 0 && <span className="tn-badge-dot">{t.count}</span>}
              </button>
            ))}
          </nav>
          <button className="tn-btn tn-btn--ghost tn-btn--sm" onClick={onLogout}><Icon name="fa-right-from-bracket" /> Log out</button>
        </aside>

        <main className="tn-main">
          {demo && (
            <div className="tn-demo-banner">
              <span><Icon name="fa-flask" /> Demo mode — sample data, nothing is saved to a server.</span>
              <button className="tn-btn tn-btn--ghost tn-btn--sm" onClick={() => { exitDemo(); router.push('/login'); }}>Exit demo</button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
