import Link from 'next/link';
import './footer.css';

export default function Footer() {
  return (
    <footer className="tn-footer">
      <div className="tn-footer-inner">
        <div>
          <strong className="tn-title tn-footer-brand">TechNeeds IGDTUW</strong>
          <p>A student community for tech introductory sessions, mentorship programs, hackathons and friendly competition.</p>
        </div>
        <nav aria-label="Footer">
          <h2>Explore</h2>
          <Link href="/leaderboard">Leaderboard</Link>
          <Link href="/techboard">Techboard</Link>
          <Link href="/team">Team</Link>
          <Link href="/faq">FAQs</Link>
        </nav>
        <div>
          <h2>Sign in</h2>
          <Link href="/mentee">Mentee</Link>
          <Link href="/mentor">Mentor</Link>
          <Link href="/admin">Admin</Link>
        </div>
        <div>
          <h2>Contact</h2>
          <a href="https://wa.me/918958898580">WhatsApp +91 8958898580</a>
          <a href="mailto:techneedsigdtuw@gmail.com">techneedsigdtuw@gmail.com</a>
        </div>
      </div>
      <p className="tn-footer-copy">© {new Date().getFullYear()} TechNeeds IGDTUW</p>
    </footer>
  );
}
