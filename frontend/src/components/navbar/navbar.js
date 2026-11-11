'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import './navbar.css';
import logo from '../../assets/logo.png';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/techboard', label: 'Techboard' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/team', label: 'Team' },
  { href: '/faq', label: 'FAQs' },
];

// One place that knows which role is signed in (tokens live in localStorage).
function readSession() {
  if (typeof window === 'undefined') return null;
  if (localStorage.getItem('menteeToken')) return { role: 'mentee', home: '/dashboard', label: 'My learning' };
  if (localStorage.getItem('token')) return { role: 'mentor', home: '/mentor', label: 'Mentor panel' };
  if (sessionStorage.getItem('adminToken')) return { role: 'admin', home: '/admin', label: 'Admin panel' };
  return null;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    setSession(readSession());
    setOpen(false);
  }, [pathname]);

  const logout = () => {
    ['menteeToken', 'token', 'mentor', 'selectedProgram'].forEach((k) => localStorage.removeItem(k));
    sessionStorage.removeItem('adminToken');
    setSession(null);
    router.push('/');
  };

  const isActive = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="tn-nav">
      <div className="tn-nav-inner">
        <Link href="/" className="tn-brand" aria-label="TechNeeds IGDTUW home">
          <Image src={logo} alt="" width={40} height={40} />
          <span>TechNeeds</span>
        </Link>

        <button
          className="tn-nav-toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <i className={`fa-solid ${open ? 'fa-xmark' : 'fa-bars'}`} />
        </button>

        <nav className={`tn-nav-links ${open ? 'is-open' : ''}`} aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={isActive(l.href) ? 'is-active' : ''}>
              {l.label}
            </Link>
          ))}
          <div className="tn-nav-actions">
            {session ? (
              <>
                <Link href={session.home} className="tn-btn tn-btn-sm tn-btn-gold">{session.label}</Link>
                {session.role !== 'admin' && (
                  <Link href="/profile" className={`tn-nav-profile ${isActive('/profile') ? 'is-active' : ''}`}>
                    <i className="fa-solid fa-wand-magic-sparkles" /> My profile
                  </Link>
                )}
                <button className="tn-nav-logout" onClick={logout}>Log out</button>
              </>
            ) : (
              <>
                <Link href="/mentee" className="tn-btn tn-btn-sm tn-btn-gold">Mentee login</Link>
                <Link href="/mentor" className="tn-nav-secondary">Mentor login</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
