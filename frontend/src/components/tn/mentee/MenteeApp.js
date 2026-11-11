'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { clearSession, exitDemo, getToken, isDemo } from '@/lib/session';
import { startDemo } from '@/lib/demoEntry';
import { buildProfile } from '@/lib/aiProfile';
import Avatar from '../Avatar';
import Shell from '../Shell';
import { LeaderboardView, useLeaderboard } from '../Leaderboard';
import { Empty, SkeletonBlocks } from '../ui';
import Learn from './Learn';
import AIProfile from './AIProfile';

const TABS = [
  { id: 'learn', label: 'Learning', icon: 'fa-book-open' },
  { id: 'board', label: 'Leaderboard', icon: 'fa-ranking-star' },
  { id: 'profile', label: 'AI Profile', icon: 'fa-wand-magic-sparkles' }
];

export default function MenteeApp({ initialTab = 'learn' }) {
  const router = useRouter();
  const [tab, setTab] = useState(initialTab);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const { rows, reload: reloadBoard } = useLeaderboard();

  const load = useCallback(async () => {
    try {
      setData(await api.getDashboard());
      setError(null);
    } catch (e) {
      if (e.status === 401 || e.status === 403) {
        clearSession('mentee');
        router.replace('/mentee');
        return;
      }
      setError(e);
    }
  }, [router]);

  useEffect(() => {
    if (!getToken('mentee')) { router.replace('/mentee'); return; }
    load();
  }, [load, router]);

  const reload = useCallback(async () => { await Promise.all([load(), reloadBoard()]); }, [load, reloadBoard]);
  const logout = () => { clearSession('mentee'); exitDemo(); router.push('/mentee'); };

  if (error && !data) {
    return (
      <div className="tn-container tn-page">
        <div className="tn-card" style={{ maxWidth: 560, margin: '3rem auto' }}>
          <Empty icon="fa-plug-circle-xmark" title="We couldn’t load your dashboard">
            <p>{error.message}</p>
            <div className="tn-row" style={{ justifyContent: 'center', marginTop: '1rem' }}>
              <button className="tn-btn tn-btn--primary tn-btn--sm" onClick={load}>Try again</button>
              {error.network && !isDemo() && <button className="tn-btn tn-btn--soft tn-btn--sm" onClick={() => { startDemo('mentee'); load(); }}>Use demo data instead</button>}
            </div>
          </Empty>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="tn-container tn-page"><SkeletonBlocks count={4} height={110} /></div>;
  }

  const persona = buildProfile(data, { leaderboard: rows || undefined });

  return (
    <Shell
      user={{ name: data.name, sub: data.enrollmentNumber, avatar: <Avatar {...persona.avatar} size={46} /> }}
      tabs={TABS}
      active={tab}
      onTab={setTab}
      onLogout={logout}
    >
      {tab === 'learn' && <Learn data={data} reload={reload} />}
      {tab === 'board' && (
        <div className="tn-card">
          <div className="tn-card-head"><h2>Leaderboard</h2><span className="tn-chip tn-chip--teal">Live</span></div>
          {rows ? <LeaderboardView rows={rows} highlightId={data.id} /> : <SkeletonBlocks count={5} height={52} />}
        </div>
      )}
      {tab === 'profile' && <AIProfile data={data} leaderboard={rows || undefined} reload={reload} onGoLearn={() => setTab('learn')} />}
    </Shell>
  );
}
