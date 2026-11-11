'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Field } from '../ui';
import { useToast } from '../Toast';

export default function ProjectForm({ resourceId, initial, onDone }) {
  const toast = useToast();
  const [form, setForm] = useState({ githubLink: initial?.githubLink || '', deployedLink: initial?.deployedLink || '', description: initial?.description || '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const words = form.description.trim().split(/\s+/).filter(Boolean).length;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.submitProject(resourceId, form);
      toast.success(res.message || 'Project submitted!');
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="tn-stack" onSubmit={submit}>
      <Field label="GitHub repository"><input className="tn-input" type="url" required placeholder="https://github.com/you/project" value={form.githubLink} onChange={set('githubLink')} /></Field>
      <Field label="Live project link"><input className="tn-input" type="url" required placeholder="https://your-project.vercel.app" value={form.deployedLink} onChange={set('deployedLink')} /></Field>
      <Field label="What did you build?">
        <textarea className="tn-textarea" required rows={6} placeholder="Describe the idea, the tech you used, and what you learned…" value={form.description} onChange={set('description')} />
        <span className="tn-muted" style={{ fontSize: '.78rem' }}>{words} words · a few solid sentences help your mentor score it faster</span>
      </Field>
      <button className="tn-btn tn-btn--primary" disabled={busy}>{busy ? 'Submitting…' : initial ? 'Resubmit project' : 'Submit project'}</button>
    </form>
  );
}
