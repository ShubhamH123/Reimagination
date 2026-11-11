import Link from 'next/link';
import Image from 'next/image';
import logo from '../../assets/logo.png';

const LINKS = [
  ['/leaderboard', 'Leaderboard'],
  ['/techboard', 'Techboard'],
  ['/team', 'Team'],
  ['/faq', 'FAQs'],
  ['/login', 'Sign in']
];

export default function Footer() {
  return (
    <footer className="tn-footer">
      <div className="tn-container tn-footer-grid">
        <div>
          <div className="tn-brand" style={{ marginBottom: '.8rem' }}>
            <Image src={logo} alt="" width={38} height={38} />
            <span>Tech<span className="tn-grad-text">Needs</span></span>
          </div>
          <p className="tn-muted" style={{ maxWidth: 420 }}>
            TechNeeds IGDTUW is a community built around “all_you_need_to_know_about_tech”: introductory sessions, mentorship programs, hackathons and a friendly competitive environment to learn and grow together.
          </p>
        </div>
        <div>
          <h4>Explore</h4>
          <ul>{LINKS.map(([href, label]) => <li key={href}><Link href={href}>{label}</Link></li>)}</ul>
        </div>
        <div>
          <h4>Get in touch</h4>
          <ul>
            <li><a href="https://wa.me/918958898580">WhatsApp · +91 8958898580</a></li>
            <li><a href="mailto:techneedsigdtuw@gmail.com">techneedsigdtuw@gmail.com</a></li>
          </ul>
        </div>
      </div>
      <div className="tn-container tn-footer-bottom">© {new Date().getFullYear()} TechNeeds IGDTUW. All rights reserved.</div>
    </footer>
  );
}
