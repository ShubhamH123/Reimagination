'use client';

// Generated avatar: a seeded gem + initials, wrapped in a ring whose five arcs show the five skill scores.
// Same person -> same avatar; level changes the gem; skills change the ring.
const PALETTES = [
  ['#0e8f9c', '#1b1740'], ['#ffb020', '#e5484d'], ['#7a5cff', '#1b1740'],
  ['#1e9e6a', '#0a6b75'], ['#e5484d', '#7a5cff'], ['#2d7ff9', '#0e8f9c'],
];

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h >>> 0);
}

export default function Avatar({ seed = 'tn', name = '', level = 1, skills = [], size = 168 }) {
  const h = hash(String(seed));
  const [c1, c2] = PALETTES[h % PALETTES.length];
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';
  const id = `av-${h}`;
  const R = 78;
  const circ = 2 * Math.PI * R;
  const seg = circ / 5;
  const gap = 8;
  const gems = Math.min(2 + level, 6);

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" role="img" aria-label={`Avatar for ${name || 'user'}`}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
        <clipPath id={`${id}-c`}><circle cx="100" cy="100" r="62" /></clipPath>
      </defs>

      {/* skill ring: 5 arcs, each filled to its skill value */}
      {[0, 1, 2, 3, 4].map((i) => {
        const value = Math.max(0, Math.min(100, (skills[i] && skills[i].value) || 0));
        const rot = -90 + i * 72 + 4;
        return (
          <g key={i} transform={`rotate(${rot} 100 100)`}>
            <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="9" strokeLinecap="round"
              strokeDasharray={`${seg - gap} ${circ}`} />
            <circle cx="100" cy="100" r={R} fill="none" stroke="#ffb020" strokeWidth="9" strokeLinecap="round"
              strokeDasharray={`${Math.max(0.001, ((seg - gap) * value) / 100)} ${circ}`} />
          </g>
        );
      })}

      {/* gem */}
      <circle cx="100" cy="100" r="62" fill={`url(#${id}-g)`} />
      <g clipPath={`url(#${id}-c)`} opacity=".5">
        {Array.from({ length: gems }).map((_, i) => {
          const a = ((hash(`${seed}-${i}`) % 360) * Math.PI) / 180;
          const d = 18 + (hash(`${seed}-d${i}`) % 36);
          const r = 18 + (hash(`${seed}-r${i}`) % 26);
          return <circle key={i} cx={100 + Math.cos(a) * d} cy={100 + Math.sin(a) * d} r={r} fill="#fff" fillOpacity=".25" />;
        })}
      </g>
      <text x="100" y="116" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="800" fontSize="46" fill="#fff">
        {initials}
      </text>
    </svg>
  );
}
