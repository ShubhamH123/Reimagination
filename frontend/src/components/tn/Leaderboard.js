'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Avatar from './Avatar';
import { Empty, Icon, Spinner } from './ui';

/** Fetches the leaderboard and refreshes it every 30s so it feels live. */
export function useLeaderboard(intervalMs = 30000) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setRows(await api.getLeaderboard());
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, intervalMs);
    return () => clearInterval(t);
  }, [load, intervalMs]);

  return { rows, error, reload: load };
}

function PodiumCol({ row, place }) {
  return (
    <div className={`tn-podium-col tn-podium-col--${place}`}>
      <span className={`tn-medal tn-medal--${place}`}>{place}</span>
      <Avatar seed={row.name} hue={(place * 70 + 180) % 360} size={place === 1 ? 74 : 60} />
      <h4>{row.name}</h4>
      <div className="tn-score tn-grad-text">{row.totalScore}</div>
      <span className="tn-chip tn-chip--coral"><Icon name="fa-fire" /> {row.streak}d</span>
    </div>
  );
}

export function LeaderboardView({ rows, highlightId }) {
  if (!rows.length) return <Empty icon="fa-trophy" title="No one on the board yet">Scores appear as soon as mentees complete resources.</Empty>;

  const top = rows.slice(0, 3);
  const rest = rows.slice(3);
  const order = [top[1], top[0], top[2]].filter(Boolean); // 2nd · 1st · 3rd

  return (
    <>
      {top.length === 3 && (
        <div className="tn-podium">
          {order.map((r) => <PodiumCol key={r.rank} row={r} place={r.rank} />)}
        </div>
      )}
      <div className="tn-stack" style={{ gap: '.35rem' }}>
        {(top.length === 3 ? rest : rows).map((r) => (
          <div key={r.id || r.rank} className={`tn-lb-row ${highlightId && r.id === highlightId ? 'tn-lb-row--me' : ''}`}>
            <span className="tn-rank">#{r.rank}</span>
            <span className="tn-row" style={{ gap: '.7rem', flexWrap: 'nowrap' }}>
              <Avatar seed={r.name} hue={(r.rank * 47) % 360} size={34} />
              <strong>{r.name}{highlightId && r.id === highlightId ? ' (you)' : ''}</strong>
            </span>
            <span className="tn-chip tn-chip--coral tn-hide-sm"><Icon name="fa-fire" /> {r.streak}d</span>
            <strong>{r.totalScore} <small className="tn-muted">pts</small></strong>
          </div>
        ))}
      </div>
    </>
  );
}

/** Stand-alone public page body. */
export default function PublicLeaderboard() {
  const { rows, error, reload } = useLeaderboard();
  return (
    <div className="tn-container tn-page" style={{ maxWidth: 820 }}>
      <div className="tn-section-head" style={{ marginTop: '1rem' }}>
        <span className="tn-eyebrow">Live rankings</span>
        <h1 style={{ fontSize: 'clamp(1.9rem,4vw,2.8rem)', fontWeight: 800 }}>Leaderboard</h1>
        <p className="tn-muted">Ranked by points, then streak. Updates automatically.</p>
      </div>
      {error && !rows ? (
        <div className="tn-card"><Empty icon="fa-plug-circle-xmark" title="Couldn't load the leaderboard"><p>{error}</p><button className="tn-btn tn-btn--soft tn-btn--sm" onClick={reload} style={{ marginTop: '.8rem' }}>Try again</button></Empty></div>
      ) : !rows ? <Spinner label="Loading rankings…" /> : <div className="tn-card"><LeaderboardView rows={rows} /></div>}
    </div>
  );
}
