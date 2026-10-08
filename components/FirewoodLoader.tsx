'use client';

import { useEffect, useState } from 'react';

export type FirewoodLoaderProps = {
  durationMs?: number;
  onComplete?: () => void;
  initialOnly?: boolean;
  className?: string;
};

export default function FirewoodLoader({
  durationMs = 2100,
  onComplete,
  initialOnly = false,
  className = '',
}: FirewoodLoaderProps) {
  const [stage, setStage] = useState<'animating' | 'fading' | 'hidden'>(() => {
    if (typeof window !== 'undefined' && initialOnly) {
      if (sessionStorage.getItem('brennholz_loader_shown') === '1') {
        return 'hidden';
      }
    }
    return 'animating';
  });

  useEffect(() => {
    if (stage === 'hidden') return;

    if (typeof window !== 'undefined' && initialOnly) {
      sessionStorage.setItem('brennholz_loader_shown', '1');
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const animDuration = prefersReducedMotion ? 300 : durationMs;

    const fadeTimer = setTimeout(() => {
      setStage('fading');
    }, animDuration);

    const hideTimer = setTimeout(() => {
      setStage('hidden');
      if (onComplete) onComplete();
    }, animDuration + 400);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [durationMs, initialOnly, onComplete, stage]);

  if (stage === 'hidden') return null;

  return (
    <div
      className={`firewood-loader-overlay ${
        stage === 'fading' ? 'firewood-loader-overlay--fading' : ''
      } ${className}`}
      aria-label="Chargement Bren-nholz"
      role="status"
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* SVG Animation Area */}
        <svg
          className="w-48 h-48 sm:w-56 sm:h-56"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Ambient Fire Glow */}
            <radialGradient id="fwFireGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#ea580c" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#140d09" stopOpacity="0" />
            </radialGradient>

            {/* Log 1 (Bottom Horizontal Base) */}
            <linearGradient id="fwLogGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8c4e28" />
              <stop offset="50%" stopColor="#5c3116" />
              <stop offset="100%" stopColor="#3d1e0a" />
            </linearGradient>

            {/* Log 2 (Left Slanted) */}
            <linearGradient id="fwLogGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9c592e" />
              <stop offset="60%" stopColor="#5e3215" />
              <stop offset="100%" stopColor="#3b1d09" />
            </linearGradient>

            {/* Log 3 (Right Slanted) */}
            <linearGradient id="fwLogGrad3" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8f5027" />
              <stop offset="60%" stopColor="#572d13" />
              <stop offset="100%" stopColor="#361907" />
            </linearGradient>

            {/* Flame Gradients */}
            <linearGradient id="fwFlameOuter" x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="45%" stopColor="#ea580c" />
              <stop offset="85%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#fb923c" />
            </linearGradient>

            <linearGradient id="fwFlameInner" x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="50%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#fef08a" />
            </linearGradient>

            <linearGradient id="fwFlameCore" x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>

            <filter id="fwGlowBlur" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="12" />
            </filter>
            <filter id="fwSparkGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>

          {/* Background Ambient Fire Glow */}
          <circle
            cx="100"
            cy="115"
            r="65"
            fill="url(#fwFireGlow)"
            className="fw-glow"
            filter="url(#fwGlowBlur)"
          />

          {/* --- THREE FIREWOOD LOGS --- */}

          {/* Log 1: Base Log */}
          <g className="fw-log-1">
            <rect
              x="42"
              y="142"
              width="116"
              height="16"
              rx="8"
              fill="url(#fwLogGrad1)"
            />
            <path
              d="M58 147 H140 M65 152 H130"
              stroke="#42200a"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.6"
            />
            <ellipse cx="50" cy="150" rx="5" ry="7" fill="#aa7144" />
            <ellipse cx="50" cy="150" rx="2.5" ry="3.8" fill="#6d4223" />
          </g>

          {/* Log 2: Left Diagonal Log */}
          <g className="fw-log-2">
            <rect
              x="48"
              y="130"
              width="104"
              height="15"
              rx="7.5"
              fill="url(#fwLogGrad2)"
            />
            <path
              d="M62 135 H138 M70 139 H130"
              stroke="#3a1b08"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.5"
            />
            <ellipse cx="55" cy="137.5" rx="4.5" ry="6.5" fill="#a56c40" />
          </g>

          {/* Log 3: Right Diagonal Log */}
          <g className="fw-log-3">
            <rect
              x="48"
              y="130"
              width="104"
              height="15"
              rx="7.5"
              fill="url(#fwLogGrad3)"
            />
            <path
              d="M62 135 H138 M70 139 H130"
              stroke="#331706"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.5"
            />
            <ellipse cx="145" cy="137.5" rx="4.5" ry="6.5" fill="#9e653a" />
          </g>

          {/* --- SPARK & FLAME --- */}

          {/* Floating Embers */}
          <circle
            cx="94"
            cy="85"
            r="2"
            fill="#facc15"
            className="fw-ember-1"
            style={{ '--dx': '-10px' } as React.CSSProperties}
          />
          <circle
            cx="108"
            cy="70"
            r="2.5"
            fill="#f97316"
            className="fw-ember-2"
            style={{ '--dx': '12px' } as React.CSSProperties}
          />
          <circle
            cx="98"
            cy="55"
            r="1.8"
            fill="#fef08a"
            className="fw-ember-3"
            style={{ '--dx': '-4px' } as React.CSSProperties}
          />

          {/* Spark Starburst */}
          <g className="fw-spark">
            <circle cx="100" cy="120" r="8" fill="#fef08a" filter="url(#fwSparkGlow)" />
            <path
              d="M100 106 L102.5 117.5 L114 120 L102.5 122.5 L100 134 L97.5 122.5 L86 120 L97.5 117.5 Z"
              fill="#ffffff"
            />
          </g>

          {/* Flame Layers */}
          <g className="fw-flame">
            {/* Outer Flame */}
            <path
              d="M100 42 C120 70 128 95 122 118 C116 138 84 138 78 118 C72 95 80 70 100 42 Z"
              fill="url(#fwFlameOuter)"
            />
            {/* Middle Flame */}
            <path
              d="M100 58 C113 78 118 96 114 114 C110 130 90 130 86 114 C82 96 87 78 100 58 Z"
              fill="url(#fwFlameInner)"
            />
            {/* Core Flame */}
            <path
              d="M100 78 C107 90 110 102 107 112 C104 122 96 122 93 112 C90 102 93 90 100 78 Z"
              fill="url(#fwFlameCore)"
            />
          </g>
        </svg>

        {/* Brand Tagline */}
        <div className="fw-text mt-4 flex flex-col items-center text-center space-y-1">
          <span className="text-xs sm:text-sm font-black tracking-[0.28em] text-orange-500 uppercase">
            Bren-nholz
          </span>
          <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.18em] text-stone-400 uppercase">
            Chauffage & Bois de qualité
          </span>
        </div>
      </div>
    </div>
  );
}
