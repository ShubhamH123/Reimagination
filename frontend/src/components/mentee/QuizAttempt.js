'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../lib/config';
import './mentee.css';

export default function QuizAttempt({ resourceId, onComplete, onCancel }) {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('menteeToken');
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/api/m/resources/${resourceId}/quiz`, { headers: { 'x-auth-token': token } });
        setQuiz(res.data);
        setAnswers(res.data.questions.map((q) => ({ questionId: q.id, selectedOptionIndex: -1 })));
      } catch (err) {
        setError(err.response?.data?.error || 'Could not load this quiz.');
      } finally {
        setLoading(false);
      }
    })();
  }, [resourceId]);

  const choose = (qIndex, optIndex) => {
    setAnswers((prev) => prev.map((a, i) => (i === qIndex ? { ...a, selectedOptionIndex: optIndex } : a)));
  };

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('menteeToken');
      const res = await axios.post(`${API_URL}/api/m/resources/${resourceId}/quiz/submit`, { answers }, { headers: { 'x-auth-token': token } });
      onComplete(res.data.score);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit the quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="tn-muted">Loading quiz…</p>;
  if (!quiz) return <div className="tn-alert tn-alert-error">{error || 'No quiz found.'}</div>;

  const unanswered = answers.filter((a) => a.selectedOptionIndex === -1).length;
  return (
    <div>
      {error && <div className="tn-alert tn-alert-error" role="alert">{error}</div>}
      {quiz.title && <h4 className="tn-title tn-h3">{quiz.title}</h4>}
      {quiz.description && <p className="tn-muted">{quiz.description}</p>}
      {quiz.questions.map((q, i) => (
        <fieldset key={q._id || i} className="tn-quiz-q" style={{ border: 0, padding: 0 }}>
          <legend style={{ fontWeight: 700, fontSize: '1rem' }}>{i + 1}. {q.questionText}</legend>
          {q.options.map((opt, j) => (
            <label key={j} className="tn-quiz-opt">
              <input type="radio" name={`question-${i}`} checked={answers[i].selectedOptionIndex === j} onChange={() => choose(i, j)} />
              {opt}
            </label>
          ))}
        </fieldset>
      ))}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="tn-btn tn-btn-teal" onClick={submit} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit quiz'}</button>
        {onCancel && <button className="tn-btn tn-btn-ghost" onClick={onCancel}>Cancel</button>}
        {unanswered > 0 && <span className="tn-muted">{unanswered} unanswered</span>}
      </div>
    </div>
  );
}
