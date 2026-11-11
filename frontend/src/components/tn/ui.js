'use client';
import { useEffect, useState } from 'react';

export const Icon = ({ name, className = '' }) => <i className={`fas ${name} ${className}`} aria-hidden="true" />;

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="tn-center" role="status">
      <span className="tn-spinner" />
      <span>{label}</span>
    </div>
  );
}

export function SkeletonBlocks({ count = 3, height = 90 }) {
  return (
    <div className="tn-stack" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => <div key={i} className="tn-skeleton" style={{ height }} />)}
    </div>
  );
}

export function StatCard({ icon, label, value, tone = 'brand' }) {
  return (
    <div className="tn-card tn-stat">
      <div className={`tn-stat-icon tn-stat-icon--${tone}`}><Icon name={icon} /></div>
      <div>
        <div className="tn-stat-label">{label}</div>
        <div className="tn-stat-value">{value}</div>
      </div>
    </div>
  );
}

export function Empty({ icon = 'fa-inbox', title, children }) {
  return (
    <div className="tn-empty">
      <Icon name={icon} />
      <strong>{title}</strong>
      {children}
    </div>
  );
}

export function Progress({ value, tone = '' }) {
  return (
    <div className={`tn-progress ${tone ? `tn-progress--${tone}` : ''}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Field({ label, children, className = '' }) {
  return (
    <div className={`tn-field ${className}`}>
      {label && <label>{label}</label>}
      {children}
    </div>
  );
}

export function PasswordInput({ value, onChange, placeholder = 'Password', autoComplete = 'current-password', ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <div className="tn-pass">
      <input className="tn-input" type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} {...rest} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
        <Icon name={show ? 'fa-eye-slash' : 'fa-eye'} />
      </button>
    </div>
  );
}

export function Modal({ title, onClose, children, width }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="tn-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="tn-modal" role="dialog" aria-modal="true" aria-label={title} style={width ? { width } : undefined}>
        <div className="tn-card-head">
          <h3>{title}</h3>
          <button className="tn-btn tn-btn--ghost tn-icon-btn" onClick={onClose} aria-label="Close"><Icon name="fa-xmark" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- formatting helpers ---------- */
export function deadlineInfo(iso) {
  if (!iso) return { label: 'No deadline', tone: 'gray' };
  const days = (new Date(iso) - Date.now()) / 86400000;
  const date = new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  if (days < 0) return { label: `Overdue · ${date}`, tone: 'danger', overdue: true };
  if (days <= 1) return { label: `Due today · ${date}`, tone: 'coral' };
  if (days <= 3) return { label: `Due in ${Math.ceil(days)} days · ${date}`, tone: 'coral' };
  return { label: `Due ${date}`, tone: 'gray' };
}

export const TYPE_ICON = { video: 'fa-play', quiz: 'fa-bolt', project: 'fa-hammer' };
export const initials = (name = '') => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
