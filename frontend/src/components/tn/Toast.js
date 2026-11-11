'use client';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext({ show: () => {}, success: () => {}, error: () => {} });
export const useToast = () => useContext(ToastContext);

/** Non-blocking notifications that replace window.alert(). */
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const show = useCallback((message, kind = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), kind === 'error' ? 6000 : 3800);
  }, []);

  const api = useMemo(
    () => ({ show, success: (m) => show(m, 'ok'), error: (m) => show(m, 'error') }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="tn-toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`tn-toast ${t.kind === 'ok' ? 'tn-toast--ok' : t.kind === 'error' ? 'tn-toast--error' : ''}`}>
            <i className={`fas ${t.kind === 'ok' ? 'fa-circle-check' : t.kind === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info'}`} aria-hidden="true" />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
