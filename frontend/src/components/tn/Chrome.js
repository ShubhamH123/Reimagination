'use client';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

// Dashboards use the full viewport, so the marketing footer is hidden there.
const APP_ROUTES = ['/dashboard', '/profile', '/mentor', '/admin'];

export default function Chrome({ children }) {
  const pathname = usePathname();
  const isApp = APP_ROUTES.some((r) => pathname.startsWith(r));
  return (
    <>
      <Navbar />
      {children}
      {!isApp && <Footer />}
    </>
  );
}
