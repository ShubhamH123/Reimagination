'use client';
import { useId } from 'react';

const SKINS = ['#f6d3b8', '#e9b894', '#d49a72', '#b97a56', '#8d5a3c'];
const HAIRS = ['#2a1d1a', '#4a2f22', '#1d2433', '#7a4a2a', '#a0522d', '#3b2f5a'];

const hash = (str = '') => {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return h >>> 0;
};

/**
 * Generative avatar: every name gets a unique, friendly face. `hue` and `accessory` come from the
 * AI profile engine (persona), so the avatar reflects how the learner is actually doing.
 */
export default function Avatar({ seed = 'TechNeeds', hue = 230, accessory = 'none', mood = 'calm', size = 96, className = '' }) {
  const uid = useId().replace(/:/g, '');
  const h = hash(seed);
  const skin = SKINS[h % SKINS.length];
  const hair = HAIRS[(h >> 3) % HAIRS.length];
  const style = (h >> 6) % 4; // 0 short · 1 long · 2 bun · 3 curly
  const shirt = `hsl(${hue} 70% 56%)`;
  const ink = '#1a2142';

  return (
    <svg className={className} width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={`Avatar for ${seed}`}>
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={`hsl(${hue} 90% 92%)`} />
          <stop offset="1" stopColor={`hsl(${(hue + 40) % 360} 85% 80%)`} />
        </linearGradient>
        <clipPath id={`clip-${uid}`}><circle cx="60" cy="60" r="60" /></clipPath>
      </defs>
      <g clipPath={`url(#clip-${uid})`}>
        <rect width="120" height="120" fill={`url(#bg-${uid})`} />
        {/* shoulders */}
        <path d="M14 124 C 18 92, 102 92, 106 124 Z" fill={shirt} />
        {style === 1 && <ellipse cx="60" cy="64" rx="31" ry="38" fill={hair} />}
        {/* neck + face */}
        <rect x="52" y="76" width="16" height="18" rx="6" fill={skin} />
        <rect x="52" y="76" width="16" height="7" rx="3" fill="rgba(0,0,0,.08)" />
        <ellipse cx="60" cy="58" rx="26" ry="29" fill={skin} />
        {/* hair front */}
        {style === 2 && <circle cx="60" cy="24" r="11" fill={hair} />}
        {style === 3 && [[36, 44], [47, 34], [60, 30], [73, 34], [84, 44]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="12" fill={hair} />)}
        {style !== 3 && <path d="M33 58 C 30 28, 90 28, 87 58 C 80 44, 68 40, 60 40 C 52 40, 40 44, 33 58 Z" fill={hair} />}
        {style === 1 && <path d="M33 58 C 31 70, 34 80, 38 84 L 40 60 Z M87 58 C 89 70, 86 80, 82 84 L 80 60 Z" fill={hair} />}
        {/* face details */}
        <circle cx="49" cy="61" r="3.2" fill={ink} />
        <circle cx="71" cy="61" r="3.2" fill={ink} />
        <circle cx="50" cy="60" r="1" fill="#fff" />
        <circle cx="72" cy="60" r="1" fill="#fff" />
        <circle cx="42" cy="70" r="4.5" fill="#ff8aa5" opacity=".28" />
        <circle cx="78" cy="70" r="4.5" fill="#ff8aa5" opacity=".28" />
        <path d={mood === 'happy' ? 'M49 72 Q60 84 71 72' : 'M52 74 Q60 79 68 74'} fill="none" stroke={ink} strokeWidth="2.4" strokeLinecap="round" />
        {/* accessories driven by persona */}
        {accessory === 'glasses' && (
          <g fill="rgba(255,255,255,.3)" stroke={ink} strokeWidth="2.2">
            <circle cx="49" cy="61" r="9" /><circle cx="71" cy="61" r="9" /><path d="M58 60 H62" fill="none" />
          </g>
        )}
        {accessory === 'headphones' && (
          <g>
            <path d="M31 60 C 28 18, 92 18, 89 60" fill="none" stroke={ink} strokeWidth="5" strokeLinecap="round" />
            <rect x="23" y="54" width="11" height="22" rx="5.5" fill={shirt} stroke={ink} strokeWidth="2" />
            <rect x="86" y="54" width="11" height="22" rx="5.5" fill={shirt} stroke={ink} strokeWidth="2" />
          </g>
        )}
        {accessory === 'cap' && (
          <g>
            <path d="M31 50 C 33 22, 87 22, 89 50 Z" fill={shirt} />
            <path d="M29 50 H 100 Q 102 57 92 57 H 35 Z" fill={`hsl(${hue} 70% 44%)`} />
          </g>
        )}
        {accessory === 'spark' && (
          <g fill="#f5b82e">
            <path d="M96 22 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" />
            <path d="M20 34 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" opacity=".8" />
          </g>
        )}
      </g>
    </svg>
  );
}
