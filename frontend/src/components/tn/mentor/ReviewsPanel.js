'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Empty, Icon } from '../ui';
import { useToast } from '../Toast';

function ReviewCard({ item, onDone }) {
  const toast = useToast();
  const [score, setScore] = useState(item.maxScore);
  const [busy, setBusy] = useState(false);

  const verify = async () => {
    setBusy(true);
    try {
      const res = await api.verifyProject(item.menteeId, item.resourceId, Number(score));
      toast.success(`Scored ${res.finalScore ?? score} points for ${item.menteeName}`);
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tn-card tn-card--flat">
      <div className="tn-row tn-spread">
        <div><strong>{item.resourceTitle}</strong><div className="tn-muted" style={{ fontSize: '.85rem' }}>by {item.menteeName}{item.submittedOn ? ` · ${new Date(item.submittedOn).toLocaleDateString()}` : ''}</div></div>
        <span className="tn-chip tn-chip--gold">Max {item.maxScore}</span>
      </div>
      <p style={{ margin: '.8rem 0', color: 'var(--tn-ink-2)' }}>{item.description}</p>
      <div className="tn-row">
        {item.githubLink && <a className="tn-btn tn-btn--ghost tn-btn--sm" href={item.githubLink} target="_blank" rel="noopener noreferrer"><Icon name="fa-code-branch" /> Repository</a>}
        {item.deployedLink && <a className="tn-btn tn-btn--ghost tn-btn--sm" href={item.deployedLink} target="_blank" rel="noopener noreferrer"><Icon name="fa-arrow-up-right-from-square" /> Live demo</a>}
        <span style={{ flex: 1 }} />
        <input className="tn-input" type="number" min="0" max={item.maxScore} value={score} onChange={(e) => setScore(e.target.value)} style={{ width: 100 }} aria-label="Score" />
        <button className="tn-btn tn-btn--primary tn-btn--sm" onClick={verify} disabled={busy}>{busy ? 'Saving…' : <><Icon name="fa-check" /> Approve &amp; score</>}</button>
      </div>
    </div>
  );
}

export default function ReviewsPanel({ reviews, refresh }) {
  return (
    <div className="tn-card">
      <div className="tn-card-head"><h2>Projects awaiting review ({reviews.length})</h2></div>
      {reviews.length === 0 ? (
        <Empty icon="fa-champagne-glasses" title="Inbox zero">No project submissions are waiting for you.</Empty>
      ) : (
        <div className="tn-stack">{reviews.map((r) => <ReviewCard key={`${r.menteeId}-${r.resourceId}`} item={r} onDone={refresh} />)}</div>
      )}
    </div>
  );
}
