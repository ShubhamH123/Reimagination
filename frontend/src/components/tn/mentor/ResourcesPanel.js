'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Empty, Field, Icon, TYPE_ICON, deadlineInfo } from '../ui';
import { useToast } from '../Toast';

const toInput = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); // for <input type=datetime-local>
const inDays = (n) => toInput(new Date(Date.now() + n * 86400000));
const blankQuestion = () => ({ questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, marks: 1 });

function QuestionEditor({ q, index, onChange, onRemove, canRemove }) {
  const set = (patch) => onChange({ ...q, ...patch });
  return (
    <div className="tn-card tn-card--flat" style={{ background: '#fafbff' }}>
      <div className="tn-row tn-spread" style={{ marginBottom: '.6rem' }}>
        <strong>Question {index + 1}</strong>
        {canRemove && <button type="button" className="tn-btn tn-btn--danger tn-btn--sm" onClick={onRemove}><Icon name="fa-trash" /></button>}
      </div>
      <div className="tn-stack" style={{ gap: '.6rem' }}>
        <input className="tn-input" required placeholder="Question text" value={q.questionText} onChange={(e) => set({ questionText: e.target.value })} />
        {q.options.map((opt, i) => (
          <div key={i} className="tn-row" style={{ flexWrap: 'nowrap' }}>
            <input type="radio" name={`correct-${index}`} checked={q.correctOptionIndex === i} onChange={() => set({ correctOptionIndex: i })} aria-label={`Mark option ${'ABCD'[i]} as correct`} />
            <input className="tn-input" required placeholder={`Option ${'ABCD'[i]}`} value={opt} onChange={(e) => set({ options: q.options.map((o, j) => (j === i ? e.target.value : o)) })} />
          </div>
        ))}
        <div className="tn-row"><label className="tn-muted" style={{ fontSize: '.8rem' }}>Marks</label><input className="tn-input" type="number" min="1" style={{ width: 90 }} value={q.marks} onChange={(e) => set({ marks: Number(e.target.value) || 1 })} /><span className="tn-muted" style={{ fontSize: '.78rem' }}>Select the radio next to the correct option.</span></div>
      </div>
    </div>
  );
}

function Builder({ programId, onCreated }) {
  const toast = useToast();
  const [type, setType] = useState('video');
  const [base, setBase] = useState({ title: '', url: '', maxScore: 100, deadline: inDays(7) });
  const [quizTimes, setQuizTimes] = useState({ startTime: inDays(0), endTime: inDays(3) });
  const [questions, setQuestions] = useState([blankQuestion()]);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (type === 'quiz') {
        const maxScore = questions.reduce((s, q) => s + (q.marks || 1), 0);
        await api.addResource({ title: base.title, program: programId, questions, maxScore, startTime: new Date(quizTimes.startTime).toISOString(), endTime: new Date(quizTimes.endTime).toISOString() }, true);
        toast.success('Quiz created — it is locked until you open it for mentees.');
      } else {
        await api.addResource({ title: base.title, type, url: type === 'video' ? base.url : undefined, program: programId, maxScore: Number(base.maxScore), deadline: new Date(base.deadline).toISOString() });
        toast.success(`${type === 'video' ? 'Video' : 'Project'} published`);
      }
      setBase({ title: '', url: '', maxScore: 100, deadline: inDays(7) });
      setQuestions([blankQuestion()]);
      onCreated();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tn-card">
      <div className="tn-card-head">
        <h2>Create a resource</h2>
        <div className="tn-seg">
          {[['video', 'Video'], ['quiz', 'Quiz'], ['project', 'Project']].map(([id, label]) => (
            <button key={id} type="button" aria-pressed={type === id} onClick={() => { setType(id); setBase((b) => ({ ...b, maxScore: id === 'project' ? 300 : 100 })); }}>{label}</button>
          ))}
        </div>
      </div>
      <form onSubmit={submit} className="tn-stack">
        <div className="tn-form-grid">
          <Field label="Title" className="tn-span-2"><input className="tn-input" required value={base.title} onChange={(e) => setBase({ ...base, title: e.target.value })} placeholder={type === 'video' ? 'e.g. JavaScript Essentials' : type === 'quiz' ? 'e.g. Week 1 Quiz' : 'e.g. Build a Portfolio Site'} /></Field>
          {type === 'video' && <Field label="Video link" className="tn-span-2"><input className="tn-input" type="url" required value={base.url} onChange={(e) => setBase({ ...base, url: e.target.value })} placeholder="https://youtube.com/…" /></Field>}
          {type !== 'quiz' && (
            <>
              <Field label="Max score"><input className="tn-input" type="number" min="1" required value={base.maxScore} onChange={(e) => setBase({ ...base, maxScore: e.target.value })} /></Field>
              <Field label="Submission deadline"><input className="tn-input" type="datetime-local" required value={base.deadline} onChange={(e) => setBase({ ...base, deadline: e.target.value })} /></Field>
            </>
          )}
          {type === 'quiz' && (
            <>
              <Field label="Opens at"><input className="tn-input" type="datetime-local" required value={quizTimes.startTime} onChange={(e) => setQuizTimes({ ...quizTimes, startTime: e.target.value })} /></Field>
              <Field label="Closes at (deadline)"><input className="tn-input" type="datetime-local" required value={quizTimes.endTime} onChange={(e) => setQuizTimes({ ...quizTimes, endTime: e.target.value })} /></Field>
            </>
          )}
        </div>

        {type === 'quiz' && (
          <>
            {questions.map((q, i) => (
              <QuestionEditor key={i} q={q} index={i} canRemove={questions.length > 1} onRemove={() => setQuestions(questions.filter((_, j) => j !== i))} onChange={(nq) => setQuestions(questions.map((x, j) => (j === i ? nq : x)))} />
            ))}
            <div className="tn-row tn-spread">
              <button type="button" className="tn-btn tn-btn--soft tn-btn--sm" onClick={() => setQuestions([...questions, blankQuestion()])}><Icon name="fa-plus" /> Add question</button>
              <span className="tn-chip tn-chip--gold">Max score: {questions.reduce((s, q) => s + (q.marks || 1), 0)}</span>
            </div>
          </>
        )}

        <div><button className="tn-btn tn-btn--primary" disabled={busy}>{busy ? 'Publishing…' : <><Icon name="fa-paper-plane" /> Publish {type}</>}</button></div>
      </form>
    </div>
  );
}

export default function ResourcesPanel({ programId, resources, refresh }) {
  const toast = useToast();

  const toggleLock = async (r) => {
    try {
      await api.setResourceLock(r._id, !r.isLocked);
      toast.success(r.isLocked ? 'Opened for mentees' : 'Locked');
      refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <Builder programId={programId} onCreated={refresh} />
      <div className="tn-card">
        <div className="tn-card-head"><h2>Published resources ({resources.length})</h2></div>
        {resources.length === 0 ? (
          <Empty icon="fa-folder-open" title="Nothing published yet">Create a video, quiz or project above.</Empty>
        ) : (
          <div className="tn-stack">
            {resources.map((r) => {
              const dl = deadlineInfo(r.deadline);
              return (
                <div key={r._id} className="tn-res">
                  <div className={`tn-res-icon tn-res-icon--${r.type}`}><Icon name={TYPE_ICON[r.type]} /></div>
                  <div className="tn-res-body">
                    <h4>{r.title}</h4>
                    <div className="tn-res-meta">
                      <span className="tn-chip tn-chip--gray" style={{ textTransform: 'capitalize' }}>{r.type}</span>
                      <span className="tn-chip tn-chip--gold"><Icon name="fa-star" /> {r.maxScore} pts</span>
                      <span className={`tn-chip tn-chip--${dl.tone}`}><Icon name="fa-clock" /> {dl.label}</span>
                      {r.isLocked && <span className="tn-chip tn-chip--gray"><Icon name="fa-lock" /> Locked</span>}
                    </div>
                  </div>
                  <div className="tn-res-actions">
                    <button className={`tn-btn tn-btn--sm ${r.isLocked ? 'tn-btn--ok' : 'tn-btn--ghost'}`} onClick={() => toggleLock(r)}>
                      <Icon name={r.isLocked ? 'fa-lock-open' : 'fa-lock'} /> {r.isLocked ? 'Open to mentees' : 'Lock'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
