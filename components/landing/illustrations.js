/**
 * Hand-crafted inline SVG illustrations for the landing page.
 * Each uses a unique gradient id prefix to avoid collisions when reused.
 * Line-art style: 1.6px rounded strokes, soft gradient fills, 220x150 viewBox.
 */

export function ProjectsSvg({ id = "prj" }) {
  return (
    <svg viewBox="0 0 220 150" fill="none" className="w-full h-auto" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-a`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#22d3ee" stopOpacity=".45" />
          <stop offset="1" stopColor="#6366f1" stopOpacity=".45" />
        </linearGradient>
      </defs>
      {/* gantt frame */}
      <rect x="18" y="24" width="184" height="102" rx="12" stroke={`url(#${id}-a)`} strokeWidth="1.6" />
      {[58, 98, 138].map((x) => (
        <line key={x} x1={x} y1="24" x2={x} y2="126" stroke={`url(#${id}-a)`} strokeOpacity=".18" strokeWidth="1" />
      ))}
      {[52, 76, 100].map((y) => (
        <line key={y} x1="18" y1={y} x2="202" y2={y} stroke={`url(#${id}-a)`} strokeOpacity=".14" strokeWidth="1" />
      ))}
      {/* task bars */}
      <rect x="30" y="38" width="66" height="10" rx="5" fill={`url(#${id}-b)`} />
      <rect x="62" y="62" width="88" height="10" rx="5" fill={`url(#${id}-b)`} />
      <rect x="42" y="86" width="52" height="10" rx="5" fill={`url(#${id}-b)`} />
      <rect x="118" y="86" width="46" height="10" rx="5" fill={`url(#${id}-a)`} opacity=".85" />
      {/* progress bars */}
      <rect x="30" y="40" width="46" height="6" rx="3" fill={`url(#${id}-a)`} />
      <rect x="62" y="64" width="60" height="6" rx="3" fill={`url(#${id}-a)`} />
      {/* milestone diamond + flag */}
      <path d="M168 38 l7 7 -7 7 -7 -7 z" fill={`url(#${id}-a)`} />
      <path d="M186 88 v-16 m0 0 l10 4 -10 4" stroke={`url(#${id}-a)`} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="186" cy="92" r="2.4" fill={`url(#${id}-a)`} />
      {/* today line */}
      <line x1="150" y1="20" x2="150" y2="130" stroke={`url(#${id}-a)`} strokeOpacity=".5" strokeWidth="1" strokeDasharray="3 4" />
    </svg>
  );
}

export function PurchaseOrdersSvg({ id = "po" }) {
  return (
    <svg viewBox="0 0 220 150" fill="none" className="w-full h-auto" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-a`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34d399" stopOpacity=".35" />
          <stop offset="1" stopColor="#0ea5e9" stopOpacity=".35" />
        </linearGradient>
      </defs>
      {/* document */}
      <path d="M70 22 h56 l24 24 v76 a10 10 0 0 1 -10 10 H70 a10 10 0 0 1 -10 -10 V32 a10 10 0 0 1 10 -10 z" stroke={`url(#${id}-a)`} strokeWidth="1.6" />
      <path d="M126 22 v24 h24" stroke={`url(#${id}-a)`} strokeWidth="1.6" strokeLinejoin="round" />
      {/* text lines */}
      {[54, 68, 82].map((y) => (
        <line key={y} x1="76" y1={y} x2={140 - (y - 54) * 0.8} y2={y} stroke={`url(#${id}-a)`} strokeOpacity=".55" strokeWidth="4" strokeLinecap="round" />
      ))}
      {/* table rows */}
      <rect x="76" y="96" width="68" height="22" rx="6" stroke={`url(#${id}-a)`} strokeOpacity=".5" strokeWidth="1.2" />
      <line x1="110" y1="96" x2="110" y2="118" stroke={`url(#${id}-a)`} strokeOpacity=".5" strokeWidth="1.2" />
      {/* approval seal */}
      <circle cx="158" cy="108" r="17" fill={`url(#${id}-b)`} stroke={`url(#${id}-a)`} strokeWidth="1.6" />
      <path d="M151 108 l5 5 l10 -11" stroke={`url(#${id}-a)`} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {/* floating coins */}
      <circle cx="48" cy="46" r="9" stroke={`url(#${id}-a)`} strokeOpacity=".7" strokeWidth="1.4" />
      <path d="M48 41 v10 M44.5 44.5 h7 M44.5 47.5 h7" stroke={`url(#${id}-a)`} strokeOpacity=".7" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function VendorsSvg({ id = "ven" }) {
  return (
    <svg viewBox="0 0 220 150" fill="none" className="w-full h-auto" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-a`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a78bfa" stopOpacity=".35" />
          <stop offset="1" stopColor="#ec4899" stopOpacity=".35" />
        </linearGradient>
      </defs>
      {/* two people */}
      <circle cx="82" cy="52" r="16" stroke={`url(#${id}-a)`} strokeWidth="1.6" />
      <path d="M52 118 a30 26 0 0 1 60 0" stroke={`url(#${id}-a)`} strokeWidth="1.6" />
      <circle cx="140" cy="58" r="13" stroke={`url(#${id}-a)`} strokeOpacity=".75" strokeWidth="1.6" />
      <path d="M116 118 a24 21 0 0 1 48 0" stroke={`url(#${id}-a)`} strokeOpacity=".75" strokeWidth="1.6" />
      {/* rating stars */}
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d="M0 -5 L1.4 -1.4 L5 -1.4 L2.2 0.9 L3.2 4.6 L0 2.4 L-3.2 4.6 L-2.2 0.9 L-5 -1.4 L-1.4 -1.4 Z"
          transform={`translate(${88 + i * 12} 24) scale(${i < 4 ? 1 : 0.9})`}
          fill={i < 4 ? `url(#${id}-a)` : "none"}
          stroke={`url(#${id}-a)`}
          strokeWidth="1"
        />
      ))}
      {/* handshake arc */}
      <path d="M96 84 l12 10 l12 -10" stroke={`url(#${id}-a)`} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="96" cy="84" r="2.4" fill={`url(#${id}-a)`} />
      <circle cx="120" cy="84" r="2.4" fill={`url(#${id}-a)`} />
      {/* badge */}
      <circle cx="176" cy="92" r="15" fill={`url(#${id}-b)`} stroke={`url(#${id}-a)`} strokeWidth="1.4" />
      <path d="M170 92 l4 4 l8 -9" stroke={`url(#${id}-a)`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MaterialsSvg({ id = "mat" }) {
  return (
    <svg viewBox="0 0 220 150" fill="none" className="w-full h-auto" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-a`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f59e0b" stopOpacity=".4" />
          <stop offset="1" stopColor="#f97316" stopOpacity=".25" />
        </linearGradient>
      </defs>
      {/* pallet */}
      <rect x="52" y="118" width="116" height="10" rx="3" stroke={`url(#${id}-a)`} strokeWidth="1.6" />
      {/* stacked crates */}
      <rect x="60" y="86" width="34" height="30" rx="4" fill={`url(#${id}-b)`} stroke={`url(#${id}-a)`} strokeWidth="1.5" />
      <rect x="100" y="86" width="34" height="30" rx="4" stroke={`url(#${id}-a)`} strokeWidth="1.5" />
      <rect x="140" y="86" width="22" height="30" rx="4" fill={`url(#${id}-b)`} stroke={`url(#${id}-a)`} strokeWidth="1.5" />
      <rect x="78" y="54" width="34" height="30" rx="4" stroke={`url(#${id}-a)`} strokeWidth="1.5" />
      <rect x="118" y="54" width="30" height="30" rx="4" fill={`url(#${id}-b)`} stroke={`url(#${id}-a)`} strokeWidth="1.5" />
      <rect x="98" y="24" width="32" height="28" rx="4" stroke={`url(#${id}-a)`} strokeWidth="1.5" />
      {/* tape marks */}
      <line x1="77" y1="54" x2="77" y2="84" stroke={`url(#${id}-a)`} strokeOpacity=".5" strokeWidth="3" />
      <line x1="133" y1="24" x2="133" y2="52" stroke={`url(#${id}-a)`} strokeOpacity=".5" strokeWidth="3" />
      {/* barcode tag */}
      <rect x="168" y="40" width="30" height="20" rx="4" stroke={`url(#${id}-a)`} strokeWidth="1.3" />
      {[174, 179, 184, 188, 192].map((x, i) => (
        <line key={x} x1={x} y1="45" x2={x} y2="55" stroke={`url(#${id}-a)`} strokeWidth={i % 2 ? 1 : 1.8} />
      ))}
      {/* sparkles */}
      <path d="M44 40 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" fill={`url(#${id}-a)`} opacity=".8" />
    </svg>
  );
}

export function TrackingSvg({ id = "trk" }) {
  return (
    <svg viewBox="0 0 220 150" fill="none" className="w-full h-auto" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-a`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0ea5e9" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0ea5e9" stopOpacity=".4" />
          <stop offset="1" stopColor="#8b5cf6" stopOpacity=".4" />
        </linearGradient>
      </defs>
      {/* route */}
      <path d="M28 118 C 60 118, 70 78, 104 78 S 150 40, 192 40" stroke={`url(#${id}-a)`} strokeWidth="2" strokeDasharray="1 7" strokeLinecap="round" />
      {/* origin pin */}
      <path d="M28 106 a10 10 0 1 1 0.1 0 z" fill={`url(#${id}-b)`} stroke={`url(#${id}-a)`} strokeWidth="1.6" transform="translate(0 6)" />
      <circle cx="28" cy="112" r="3" fill={`url(#${id}-a)`} />
      {/* destination pin */}
      <path d="M192 22 c-7 0 -11 5 -11 10 c0 7 11 16 11 16 s11 -9 11 -16 c0 -5 -4 -10 -11 -10 z" fill={`url(#${id}-b)`} stroke={`url(#${id}-a)`} strokeWidth="1.6" />
      <circle cx="192" cy="32" r="3.4" fill={`url(#${id}-a)`} />
      {/* truck */}
      <g transform="translate(88 66)">
        <rect x="0" y="6" width="34" height="20" rx="4" fill={`url(#${id}-b)`} stroke={`url(#${id}-a)`} strokeWidth="1.5" />
        <path d="M34 12 h10 l7 8 v6 h-17 z" stroke={`url(#${id}-a)`} strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="10" cy="30" r="4" stroke={`url(#${id}-a)`} strokeWidth="1.5" />
        <circle cx="42" cy="30" r="4" stroke={`url(#${id}-a)`} strokeWidth="1.5" />
      </g>
      {/* checkpoint */}
      <circle cx="104" cy="78" r="6" stroke={`url(#${id}-a)`} strokeWidth="1.6" />
      <path d="M101.5 78 l2 2 l4 -4.5" stroke={`url(#${id}-a)`} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* clock */}
      <circle cx="160" cy="106" r="13" stroke={`url(#${id}-a)`} strokeOpacity=".8" strokeWidth="1.5" />
      <path d="M160 99 v7 l5 3" stroke={`url(#${id}-a)`} strokeOpacity=".8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ReportsSvg({ id = "rep" }) {
  return (
    <svg viewBox="0 0 220 150" fill="none" className="w-full h-auto" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-a`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id={`${id}-b`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#22d3ee" stopOpacity=".5" />
          <stop offset="1" stopColor="#a78bfa" stopOpacity=".5" />
        </linearGradient>
      </defs>
      {/* axis */}
      <line x1="34" y1="20" x2="34" y2="118" stroke={`url(#${id}-a)`} strokeOpacity=".6" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="34" y1="118" x2="196" y2="118" stroke={`url(#${id}-a)`} strokeOpacity=".6" strokeWidth="1.4" strokeLinecap="round" />
      {/* bars */}
      <rect x="50" y="76" width="18" height="42" rx="4" fill={`url(#${id}-b)`} stroke={`url(#${id}-a)`} strokeWidth="1.2" />
      <rect x="78" y="56" width="18" height="62" rx="4" fill={`url(#${id}-a)`} opacity=".85" />
      <rect x="106" y="88" width="18" height="30" rx="4" fill={`url(#${id}-b)`} stroke={`url(#${id}-a)`} strokeWidth="1.2" />
      <rect x="134" y="42" width="18" height="76" rx="4" fill={`url(#${id}-a)`} opacity=".7" />
      {/* trend line */}
      <path d="M55 66 L88 46 L116 78 L144 32 L188 22" stroke={`url(#${id}-a)`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="188" cy="22" r="3.4" fill={`url(#${id}-a)`} />
      {/* pie */}
      <circle cx="176" cy="80" r="20" stroke={`url(#${id}-a)`} strokeOpacity=".8" strokeWidth="1.5" />
      <path d="M176 80 L176 60 A20 20 0 0 1 194 88 z" fill={`url(#${id}-a)`} opacity=".55" />
      <path d="M176 80 L194 88 A20 20 0 0 1 160 97 z" fill={`url(#${id}-b)`} />
    </svg>
  );
}

export function AiSparkSvg({ id = "ai" }) {
  return (
    <svg viewBox="0 0 220 150" fill="none" className="w-full h-auto" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-a`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34d399" stopOpacity=".3" />
          <stop offset="1" stopColor="#22d3ee" stopOpacity=".3" />
        </linearGradient>
      </defs>
      {/* chat bubble */}
      <path d="M58 34 h104 a14 14 0 0 1 14 14 v44 a14 14 0 0 1 -14 14 h-60 l-22 18 v-18 h-22 a14 14 0 0 1 -14 -14 v-44 a14 14 0 0 1 14 -14 z" fill={`url(#${id}-b)`} stroke={`url(#${id}-a)`} strokeWidth="1.6" />
      {/* prompt lines */}
      <line x1="60" y1="56" x2="132" y2="56" stroke={`url(#${id}-a)`} strokeOpacity=".7" strokeWidth="4" strokeLinecap="round" />
      <line x1="60" y1="70" x2="108" y2="70" stroke={`url(#${id}-a)`} strokeOpacity=".45" strokeWidth="4" strokeLinecap="round" />
      {/* mini chart inside bubble */}
      <rect x="60" y="82" width="10" height="12" rx="2" fill={`url(#${id}-a)`} />
      <rect x="76" y="76" width="10" height="18" rx="2" fill={`url(#${id}-a)`} opacity=".8" />
      <rect x="92" y="86" width="10" height="8" rx="2" fill={`url(#${id}-a)`} opacity=".6" />
      {/* orbiting sparkles */}
      <ellipse cx="110" cy="74" rx="98" ry="60" stroke={`url(#${id}-a)`} strokeOpacity=".35" strokeWidth="1" strokeDasharray="2 6" />
      <path d="M196 30 l2.4 6 6 2.4 -6 2.4 -2.4 6 -2.4 -6 -6 -2.4 6 -2.4 z" fill={`url(#${id}-a)`} />
      <path d="M26 96 l1.8 4.4 4.4 1.8 -4.4 1.8 -1.8 4.4 -1.8 -4.4 -4.4 -1.8 4.4 -1.8 z" fill={`url(#${id}-a)`} opacity=".8" />
      <circle cx="204" cy="96" r="3" stroke={`url(#${id}-a)`} strokeWidth="1.3" />
      <circle cx="20" cy="42" r="2.4" fill={`url(#${id}-a)`} opacity=".7" />
    </svg>
  );
}
