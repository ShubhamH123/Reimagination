"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../lib/config';
import Avatar from '../profile/Avatar';
import ML from "../../assets/ML.png";
import Web from "../../assets/WEB.jpeg";
import Java from "../../assets/JAVA.jpeg";
import AR from "../../assets/ar.png";
import C from "../../assets/C.png";
import app from "../../assets/app.jpg";
import './home.css';

const COHORTS = [
  { title: 'Web Development', by: 'Vidusi Agarwal', image: Web },
  { title: 'DSA in C/C++', by: 'Shefali Kaushal', image: C },
  { title: 'Machine Learning', by: 'Sripriya Aggarwal', image: ML },
  { title: 'DSA in Java', by: 'Tavleen Kaur', image: Java },
  { title: 'AR/VR', by: 'Snighdha', image: AR },
  { title: 'App Development', by: 'Muskan Manvi', image: app },
];

const STATS = [['1200+', 'mentees trained'], ['50+', 'mentors'], ['10+', 'cohorts run'], ['100+', 'events']];

const QUOTES = [
  { name: 'Khushi Sharma', text: 'The senior mentors explain things in detail and give practical advice that makes hard topics easier to grasp.' },
  { name: 'Komal Maurya', text: 'Senior-led mentorship gave me expert advice and helped me find my way into a tech career.' },
  { name: 'Tanishka Manwal', text: 'The seniors share insights you cannot get from textbooks, and the community keeps you motivated.' },
];

const FLOW = [
  ['Admin', 'Creates a program and onboards mentors.', 'fa-user-shield', '/admin'],
  ['Mentor', 'Adds mentees and posts videos, quizzes and projects with deadlines.', 'fa-chalkboard-user', '/mentor'],
  ['Mentee', 'Learns, scores points and climbs the leaderboard.', 'fa-graduation-cap', '/mentee'],
];

// A sample of what every mentee gets. Shown until real leaderboard data loads.
const SAMPLE_SKILLS = [{ value: 90 }, { value: 80 }, { value: 100 }, { value: 70 }, { value: 85 }];

export default function Homepage() {
  const [top, setTop] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/api/m/leaderboard?limit=3`).then((r) => setTop(r.data)).catch(() => {});
  }, []);

  return (
    <>
      <section className="tn-hero">
        <div className="tn-hero-inner">
          <div>
            <h1 className="tn-title tn-hero-title">Learn from seniors who finished the course first.</h1>
            <p className="tn-hero-lead">
              TechNeeds is IGDTUW&apos;s student-run tech community. Join a cohort, finish videos, quizzes and projects before the deadline, and watch your profile grow.
            </p>
            <div className="tn-hero-cta">
              <Link href="/mentee" className="tn-btn tn-btn-gold">Log in as a mentee</Link>
              <Link href="/leaderboard" className="tn-btn tn-btn-ghost tn-btn-light">See the leaderboard</Link>
            </div>
          </div>

          <aside className="tn-hero-card" aria-label="Example mentee profile">
            <div className="tn-hero-card-top">
              <Avatar seed="sample-profile" name="Your Name" level={3} skills={SAMPLE_SKILLS} size={120} />
              <div>
                <strong className="tn-title" style={{ fontSize: '1.25rem' }}>Your AI profile</strong>
                <p className="tn-muted" style={{ margin: '4px 0 0' }}>Avatar, skill badges, a progress summary and next steps, written from your own activity.</p>
              </div>
            </div>
            <div className="tn-hero-card-badges">
              <span className="tn-chip tn-chip-gold"><i className="fa-solid fa-bullseye" /> Quiz ace</span>
              <span className="tn-chip tn-chip-gold"><i className="fa-solid fa-fire" /> On a roll</span>
              <span className="tn-chip tn-chip-gold"><i className="fa-solid fa-hammer" /> Builder</span>
            </div>
            {top.length > 0 && (
              <ol className="tn-hero-top">
                {top.map((m) => <li key={m.rank}><span>{m.rank}</span><strong>{m.name}</strong><em>{m.totalScore} pts</em></li>)}
              </ol>
            )}
          </aside>
        </div>
      </section>

      <section className="tn-wrap">
        <div className="tn-statrow">
          {STATS.map(([n, label]) => <div key={label}><strong>{n}</strong><span>{label}</span></div>)}
        </div>
      </section>

      <section className="tn-wrap">
        <h2 className="tn-title tn-h2">How a cohort runs</h2>
        <ol className="tn-flow">
          {FLOW.map(([role, text, icon, href], i) => (
            <li key={role}>
              <span className="tn-flow-num">{i + 1}</span>
              <i className={`fa-solid ${icon} tn-flow-icon`} />
              <h3 className="tn-title tn-h3">{role}</h3>
              <p>{text}</p>
              <Link href={href} className="tn-flow-link">Open {role.toLowerCase()} login</Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="tn-wrap" id="cohorts">
        <h2 className="tn-title tn-h2">Mentorship cohorts</h2>
        <div className="tn-cohorts">
          {COHORTS.map((c) => (
            <article key={c.title} className="tn-cohort">
              <div className="tn-cohort-img"><Image src={c.image} alt="" fill sizes="(max-width: 700px) 100vw, 340px" style={{ objectFit: 'cover' }} /></div>
              <div className="tn-cohort-body"><h3 className="tn-title tn-h3">{c.title}</h3><p className="tn-muted">Mentor: {c.by}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="tn-wrap">
        <h2 className="tn-title tn-h2">What mentees say</h2>
        <div className="tn-quotes">
          {QUOTES.map((q) => (
            <figure key={q.name} className="tn-quote"><blockquote>{q.text}</blockquote><figcaption>{q.name}</figcaption></figure>
          ))}
        </div>
      </section>
    </>
  );
}
