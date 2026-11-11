'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import logo from '../../assets/logo.png';
import { getToken } from '@/lib/session';
import { Icon } from './ui';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/techboard', label: 'Techboard' },
  { href: '/team', label: 'Team' },
  { href: '/faq', label: 'FAQs' }
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [home, setHome] = useState(null); // where a signed-in user's dashboard lives

  // Re-check on every navigation so the CTA flips right after login/logout.
  useEffect(() => {
    setHome(getToken('mentee') ? '/dashboard' : getToken('mentor') ? '/mentor' : getToken('admin') ? '/admin' : null);
  }, [pathname]);

  return (
    <header className="tn-nav">
      <div className="tn-container tn-nav-inner">
        <Link href="/" className="tn-brand" onClick={() => setOpen(false)}>
          <Image src={logo} alt="" width={38} height={38} priority />
          <span>Tech<span className="tn-grad-text">Needs</span></span>
        </Link>

        <nav className="tn-nav-links" data-open={open} aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={pathname === l.href ? 'page' : undefined} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link href={home || '/login'} className="tn-btn tn-btn--primary tn-btn--sm" style={{ marginLeft: '.4rem' }} onClick={() => setOpen(false)}>
            {home ? 'My dashboard' : 'Sign in'}
          </Link>
        </nav>

        <button className="tn-btn tn-btn--ghost tn-icon-btn tn-burger" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open}>
          <Icon name={open ? 'fa-xmark' : 'fa-bars'} />
        </button>
      </div>
    </header>
  );
}
