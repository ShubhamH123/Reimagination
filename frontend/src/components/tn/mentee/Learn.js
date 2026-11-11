'use client';
import { useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { Empty, Icon, Modal, Progress, StatCard, TYPE_ICON, deadlineInfo } from '../ui';
import { useToast } from '../Toast';
import QuizRunner from './QuizRunner';
import ProjectForm from './ProjectForm';

const FILTERS = [
  { id: 'todo', label: 'To do' },
  { id: 'done', label: 'Completed' },
  { id: 'all', label: 'All' }
];

function ResourceCard({ r, onComplete, onQuiz, onProject }) {
  const dl = deadlineInfo(r.deadline);
  const pendingReview = r.type === 'project' && r.completed && !r.verified;

  return (
    <div className={`tn-res ${r.completed && !pendingReview ? 'tn-res--done' : ''}`}>
      <div className={`tn-res-icon tn-res-icon--${r.type}`}><Icon name={TYPE_ICON[r.type]} /></div>
      <div className="tn-res-body">
        <h4>{r.title}</h4>
        <div className="tn-muted" style={{ fontSize: '.82rem' }}>{r.programName}</div>
        <div className="tn-res-meta">
          <span className="tn-chip tn-chip--gray" style={{ textTransform: 'capitalize' }}>{r.type}</span>
          <span className="tn-chip tn-chip--gold"><Icon name="fa-star" /> {r.maxScore} pts</span>
          {!r.completed && <span className={`tn-chip tn-chip--${dl.tone}`}><Icon name="fa-clock" /> {dl.label}</span>}
          {r.isLocked && <span className="tn-chip tn-chip--gray"><Icon name="fa-lock" /> Locked by mentor</span>}
          {r.quizWindow && !r.completed && <span className="tn-chip"><Icon name="fa-list-check" /> {r.quizWindow.questionCount} questions</span>}
        </div>
      </div>
      <div className="tn-res-actions">
        {r.completed && !pendingReview && <span className="tn-chip tn-chip--teal"><Icon name="fa-circle-check" /> {r.score}/{r.maxScore}</span>}
        {pendingReview && <span className="tn-chip tn-chip--gold"><Icon name="fa-hourglass-half" /> Awaiting review</span>}

        {r.type === 'video' && (
          <>
            {r.url && <a className="tn-btn tn-btn--ghost tn-btn--sm" href={r.url} target="_blank" rel="noopener noreferrer"><Icon name="fa-arrow-up-right-from-square" /> Watch</a>}
            {!r.completed && !r.isLocked && <button className="tn-btn tn-btn--ok tn-btn--sm" onClick={() => onComplete(r)}><Icon name="fa-check" /> Mark complete</button>}
          </>
        )}
        {r.type === 'quiz' && !r.completed && !r.isLocked && <button className="tn-btn tn-btn--primary tn-btn--sm" onClick={() => onQuiz(r)}><Icon name="fa-play" /> Start quiz</button>}
        {r.type === 'project' && !r.isLocked && !r.verified && (
          <button className={`tn-btn ${r.completed ? 'tn-btn--ghost' : 'tn-btn--primary'} tn-btn--sm`} onClick={() => onProject(r)}>
            <Icon name="fa-upload" /> {r.completed ? 'Edit submission' : 'Submit project'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Learn({ data, reload }) {
  const toast = useToast();
  const [filter, setFilter] = useState('todo');
  const [program, setProgram] = useState('all');
  const [quiz, setQuiz] = useState(null);
  const [project, setProject] = useState(null);

  const all = useMemo(() => data.programs.flatMap((p) => p.resources.map((r) => ({ ...r, programName: p.name, programId: p._id }))), [data]);
  const doneCount = all.filter((r) => r.completed).length;
  const percent = all.length ? Math.round((doneCount / all.length) * 100) : 0;

  const visible = all
    .filter((r) => program === 'all' || r.programId === program)
    .filter((r) => (filter === 'all' ? true : filter === 'done' ? r.completed : !r.completed))
    .sort((a, b) => new Date(a.deadline || 0) - new Date(b.deadline || 0));

  const complete = async (r) => {
    try {
      const res = await api.completeResource(r._id);
      toast.success(`+${res.score} points! Nice work.`);
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <div className="tn-row tn-spread">
        <div>
          <h1 className="tn-title">Hi {data.name.split(' ')[0]} 👋</h1>
          <p className="tn-muted">Here&apos;s what&apos;s on your plate. Keep the streak alive!</p>
        </div>
      </div>

      <div className="tn-grid tn-grid--4">
        <StatCard icon="fa-ranking-star" label="Rank" value={`#${data.rank ?? '–'}`} tone="brand" />
        <StatCard icon="fa-star" label="Points" value={data.totalScore} tone="gold" />
        <StatCard icon="fa-fire" label="Streak" value={`${data.streak}d`} tone="coral" />
        <StatCard icon="fa-circle-check" label="Completed" value={`${doneCount}/${all.length}`} tone="teal" />
      </div>

      <div className="tn-card">
        <div className="tn-row tn-spread" style={{ marginBottom: '.6rem' }}>
          <strong>Overall progress</strong><span className="tn-muted">{percent}%</span>
        </div>
        <Progress value={percent} tone="teal" />
      </div>

      <div className="tn-card">
        <div className="tn-card-head">
          <h2>Your resources</h2>
          <div className="tn-row">
            {data.programs.length > 1 && (
              <select className="tn-select" style={{ width: 'auto' }} value={program} onChange={(e) => setProgram(e.target.value)} aria-label="Filter by program">
                <option value="all">All programs</option>
                {data.programs.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            )}
            <div className="tn-seg">
              {FILTERS.map((f) => <button key={f.id} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</button>)}
            </div>
          </div>
        </div>

        <div className="tn-stack">
          {visible.length === 0 ? (
            <Empty icon={filter === 'todo' ? 'fa-champagne-glasses' : 'fa-inbox'} title={filter === 'todo' ? 'You’re all caught up!' : 'Nothing here yet'}>
              {filter === 'todo' ? 'New resources from your mentor will show up here.' : 'Complete a resource and it will appear in this list.'}
            </Empty>
          ) : visible.map((r) => <ResourceCard key={r._id} r={r} onComplete={complete} onQuiz={setQuiz} onProject={setProject} />)}
        </div>
      </div>

      {quiz && <Modal title={quiz.title} onClose={() => setQuiz(null)}><QuizRunner resourceId={quiz._id} onDone={() => { setQuiz(null); reload(); }} /></Modal>}
      {project && (
        <Modal title={project.title} onClose={() => setProject(null)}>
          <ProjectForm resourceId={project._id} onDone={() => { setProject(null); reload(); }} />
        </Modal>
      )}
    </>
  );
}
