'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../lib/config';
import './leaderboard.css';

const MEDALS = ['gold', 'silver', 'bronze'];

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/m/leaderboard`);
      setRows(res.data);
      setUpdated(new Date());
      setError('');
    } catch {
      setError(`Cannot load the leaderboard from ${API_URL}. Check that the backend is running.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000); // keeps the board live
    return () => clearInterval(id);
  }, [load]);

  if (loading) return <div className="tn-spinner" role="status" aria-label="Loading leaderboard" />;

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  // visual order: 2nd, 1st, 3rd
  const order = [podium[1], podium[0], podium[2]].filter(Boolean);

  return (
    <div className="tn-page">
      <div className="tn-section-head">
        <div>
          <h1 className="tn-title tn-h1">Leaderboard</h1>
          <p className="tn-lead">Points come from finished videos, quizzes and verified projects. Ties go to the longer streak.</p>
        </div>
        {updated && <span className="tn-chip"><i className="fa-solid fa-circle tn-live" /> Live, updated {updated.toLocaleTimeString()}</span>}
      </div>

      {error && <div className="tn-alert tn-alert-error">{error}</div>}

      {!error && rows.length === 0 && (
        <div className="tn-card tn-empty">No scores yet. Finish a resource to put your name on the board.</div>
      )}

      {order.length > 0 && (
        <div className="tn-podium">
          {order.map((m) => (
            <div key={m.rank} className={`tn-podium-step ${MEDALS[m.rank - 1]} rank-${m.rank}`}>
              <span className="tn-podium-medal"><i className="fa-solid fa-trophy" /></span>
              <strong className="tn-podium-name">{m.name}</strong>
              <span className="tn-podium-score">{m.totalScore} pts</span>
              <span className="tn-chip"><i className="fa-solid fa-fire" /> {m.streak}d</span>
              <span className="tn-podium-rank">{m.rank}</span>
            </div>
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div className="tn-table-wrap" style={{ marginTop: 24 }}>
          <table className="tn-table">
            <thead><tr><th>Rank</th><th>Name</th><th>Points</th><th>Streak</th></tr></thead>
            <tbody>
              {rest.map((m) => (
                <tr key={m.rank}>
                  <td><strong>{m.rank}</strong></td>
                  <td>{m.name}</td>
                  <td>{m.totalScore}</td>
                  <td><span className="tn-chip"><i className="fa-solid fa-fire" /> {m.streak} days</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
