'use client';
import { useState } from 'react';
import { Field, Icon, PasswordInput } from './ui';
import { useToast } from './Toast';

/**
 * Login card shared by mentee / mentor / admin.
 * fields: [{ name, label, type?, placeholder?, password? }]
 */
export default function AuthCard({ icon, title, subtitle, fields, submitLabel = 'Sign in', onSubmit, onDemo, hint }) {
  const toast = useToast();
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.name, ''])));
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit(values);
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tn-container tn-auth">
      <form className="tn-card tn-auth-card tn-stack" onSubmit={submit}>
        <div>
          <div className="tn-auth-icon"><Icon name={icon} /></div>
          <h1>{title}</h1>
          <p className="tn-muted">{subtitle}</p>
        </div>

        {fields.map((f) => (
          <Field key={f.name} label={f.label}>
            {f.password ? (
              <PasswordInput value={values[f.name]} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} required />
            ) : (
              <input
                className="tn-input" type={f.type || 'text'} placeholder={f.placeholder} value={values[f.name]}
                onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} required autoComplete={f.type === 'email' ? 'email' : 'username'}
              />
            )}
          </Field>
        ))}

        <button className="tn-btn tn-btn--primary tn-btn--block" disabled={busy}>
          {busy ? <><span className="tn-spinner" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,.4)', borderTopColor: '#fff' }} /> Signing in…</> : submitLabel}
        </button>

        {hint && <div className="tn-hint"><Icon name="fa-circle-info" /> {hint}</div>}

        {onDemo && (
          <>
            <div className="tn-divider">or</div>
            <button type="button" className="tn-btn tn-btn--soft tn-btn--block" onClick={onDemo}>
              <Icon name="fa-wand-magic-sparkles" /> Explore with demo data
            </button>
          </>
        )}
      </form>
    </div>
  );
}
