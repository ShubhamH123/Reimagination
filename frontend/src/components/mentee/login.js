'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { API_URL } from '../../lib/config';

export default function MenteeLogin() {
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/api/m/login`, { enrollmentNumber: enrollmentNumber.trim(), password });
      localStorage.setItem('menteeToken', res.data.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error === 'Invalid credentials'
        ? 'Enrollment number or password is wrong. Your mentor gave you both.'
        : err.response ? err.response.data?.error || 'Login failed' : `Cannot reach the server at ${API_URL}.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tn-page-narrow">
      <h1 className="tn-title tn-h1">Mentee login</h1>
      <p className="tn-lead">Use the enrollment number and password from your mentor.</p>
      <form className="tn-card" style={{ marginTop: 24 }} onSubmit={handleLogin}>
        {error && <div className="tn-alert tn-alert-error" role="alert">{error}</div>}
        <div className="tn-field">
          <label htmlFor="enr">Enrollment number</label>
          <input id="enr" className="tn-input" value={enrollmentNumber} onChange={(e) => setEnrollmentNumber(e.target.value)} required autoComplete="username" />
        </div>
        <div className="tn-field">
          <label htmlFor="pw">Password</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input id="pw" className="tn-input" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            <button type="button" className="tn-btn tn-btn-ghost tn-btn-sm" onClick={() => setShowPassword((s) => !s)}>{showPassword ? 'Hide' : 'Show'}</button>
          </div>
        </div>
        <button className="tn-btn tn-btn-teal" style={{ width: '100%' }} disabled={isLoading}>{isLoading ? 'Logging in…' : 'Log in'}</button>
      </form>
      <p className="tn-muted" style={{ marginTop: 16 }}>Mentoring a cohort? <Link href="/mentor" style={{ textDecoration: 'underline' }}>Mentor login</Link></p>
    </div>
  );
}
