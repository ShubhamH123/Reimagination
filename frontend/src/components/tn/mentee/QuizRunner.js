'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Icon, Progress, Spinner } from '../ui';
import { useToast } from '../Toast';

/** Runs a quiz inside a modal: load → answer → submit → result. */
export default function QuizRunner({ resourceId, onDone }) {
  const toast = useToast();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({}); // questionId -> option index
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getQuiz(resourceId).then(setQuiz).catch((e) => setError(e.message));
  }, [resourceId]);

  if (error) return <div className="tn-hint">{error}</div>;
  if (!quiz) return <Spinner label="Loading quiz…" />;

  if (result) {
    const percent = Math.round((result.score / (result.maxScore || 1)) * 100);
    return (
      <div className="tn-stack" style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div className="tn-auth-icon" style={{ margin: '0 auto', background: percent >= 60 ? 'var(--tn-grad-cool)' : 'var(--tn-grad-warm)' }}><Icon name={percent >= 60 ? 'fa-trophy' : 'fa-seedling'} /></div>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>{result.score}<span className="tn-muted" style={{ fontSize: '1.2rem' }}> / {result.maxScore}</span></h2>
        <p className="tn-muted">{percent >= 80 ? 'Outstanding work!' : percent >= 60 ? 'Nice job — solid understanding.' : 'Good effort! Revisit the videos and you’ll nail the next one.'}</p>
        <Progress value={percent} tone={percent >= 60 ? 'teal' : 'warm'} />
        <button className="tn-btn tn-btn--primary" onClick={onDone}>Back to dashboard</button>
      </div>
    );
  }

  const answered = Object.keys(answers).length;
  const submit = async () => {
    setBusy(true);
    try {
      const payload = quiz.questions.map((q) => ({ questionId: q.id, selectedOptionIndex: answers[q.id] ?? -1 }));
      setResult(await api.submitQuiz(resourceId, payload));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="tn-row tn-spread" style={{ marginBottom: '.6rem' }}>
        <span className="tn-chip">{answered}/{quiz.questions.length} answered</span>
        <span className="tn-muted" style={{ fontSize: '.82rem' }}>Closes {new Date(quiz.endTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
      </div>
      <Progress value={(answered / quiz.questions.length) * 100} />

      {quiz.questions.map((q, i) => (
        <div key={q.id} className="tn-quiz-q">
          <strong>Q{i + 1}. {q.questionText}</strong>
          {q.marks > 1 && <span className="tn-chip tn-chip--gold" style={{ marginLeft: '.5rem' }}>{q.marks} marks</span>}
          {q.options.map((opt, j) => (
            <button key={j} className="tn-option" aria-pressed={answers[q.id] === j} onClick={() => setAnswers({ ...answers, [q.id]: j })}>
              <span className="tn-letter">{'ABCD'[j]}</span> {opt}
            </button>
          ))}
        </div>
      ))}

      <button className="tn-btn tn-btn--primary tn-btn--block" style={{ marginTop: '1rem' }} onClick={submit} disabled={busy || answered < quiz.questions.length}>
        {busy ? 'Submitting…' : answered < quiz.questions.length ? `Answer all questions to submit` : 'Submit quiz'}
      </button>
      <p className="tn-muted" style={{ fontSize: '.8rem', marginTop: '.6rem', textAlign: 'center' }}>You can only submit once, so double-check your answers.</p>
    </div>
  );
}
