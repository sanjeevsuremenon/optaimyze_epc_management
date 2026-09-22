/**
 * Shared liquid-glass + 3D tilt building blocks.
 * Used by the public landing page and the authenticated dashboard (ModuleGrid).
 */
import React, { useRef, useState } from "react";

/** Global styles for .liquid-glass surfaces, specular highlight, and keyframes. */
export function GlassStyles() {
  return (
    <style jsx global>{`
      .landing-root {
        --glass-border-light: rgba(15, 23, 42, 0.09);
        --glass-border-dark: rgba(255, 255, 255, 0.12);
      }
      .liquid-glass {
        background: linear-gradient(145deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.45));
        border-color: var(--glass-border-light);
        backdrop-filter: blur(18px) saturate(150%);
        -webkit-backdrop-filter: blur(18px) saturate(150%);
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.9),
          inset 0 -1px 0 rgba(15, 23, 42, 0.04),
          0 18px 40px -18px rgba(15, 23, 42, 0.25);
      }
      .dark .liquid-glass {
        background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.025));
        border-color: var(--glass-border-dark);
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.16),
          inset 0 -1px 0 rgba(255, 255, 255, 0.03),
          0 22px 50px -20px rgba(0, 0, 0, 0.7);
      }
      .liquid-glass-cyan { --glow: rgba(34, 211, 238, 0.35); }
      .liquid-glass-emerald { --glow: rgba(52, 211, 153, 0.35); }
      .liquid-glass-violet { --glow: rgba(167, 139, 250, 0.35); }
      .liquid-glass-amber { --glow: rgba(245, 158, 11, 0.35); }
      .liquid-glass-sky { --glow: rgba(14, 165, 233, 0.35); }
      .liquid-glass-indigo { --glow: rgba(99, 102, 241, 0.35); }
      .liquid-glass-rose { --glow: rgba(244, 63, 94, 0.3); }
      .liquid-glass-slate { --glow: rgba(100, 116, 139, 0.35); }
      .liquid-glass:hover {
        border-color: var(--glow);
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.9),
          0 24px 60px -18px var(--glow),
          0 18px 40px -18px rgba(15, 23, 42, 0.25);
      }
      .dark .liquid-glass:hover {
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.16),
          0 26px 70px -20px var(--glow),
          0 22px 50px -20px rgba(0, 0, 0, 0.7);
      }
      .specular {
        opacity: 0;
        transition: opacity 0.35s ease;
        background: radial-gradient(
          340px circle at var(--mx, 50%) var(--my, 50%),
          rgba(255, 255, 255, 0.55),
          transparent 55%
        );
      }
      .dark .specular {
        background: radial-gradient(
          340px circle at var(--mx, 50%) var(--my, 50%),
          rgba(255, 255, 255, 0.22),
          transparent 55%
        );
      }
      .liquid-glass:hover .specular { opacity: 1; }

      @keyframes heroFloat {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-12px); }
      }
      @keyframes heroBarGrow {
        from { transform: scaleY(0); }
        to { transform: scaleY(1); }
      }
      .hero-bar {
        transform-origin: bottom;
        transform-box: fill-box;
        animation: heroBarGrow 0.8s cubic-bezier(0.22, 1, 0.36, 1) backwards;
      }
      @keyframes drift {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(30px, -20px) scale(1.06); }
        66% { transform: translate(-20px, 15px) scale(0.97); }
      }
      .blob { animation: drift 14s ease-in-out infinite; }
      .blob-2 { animation: drift 18s ease-in-out infinite reverse; }
      @keyframes pulseRing {
        0% { transform: scale(0.9); opacity: 0.7; }
        100% { transform: scale(1.6); opacity: 0; }
      }
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeInUpBig {
        0% { opacity: 0; transform: translateY(42px) scale(0.96); }
        60% { opacity: 1; }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      .hero-grid-bg {
        background-image:
          linear-gradient(rgba(100, 116, 139, 0.12) 1px, transparent 1px),
          linear-gradient(90deg, rgba(100, 116, 139, 0.12) 1px, transparent 1px);
        background-size: 44px 44px;
        mask-image: radial-gradient(ellipse 90% 70% at 50% 30%, black 30%, transparent 75%);
        -webkit-mask-image: radial-gradient(ellipse 90% 70% at 50% 30%, black 30%, transparent 75%);
      }
      .dark .hero-grid-bg {
        background-image:
          linear-gradient(rgba(148, 163, 184, 0.14) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148, 163, 184, 0.14) 1px, transparent 1px);
      }
      @media (prefers-reduced-motion: reduce) {
        .blob, .blob-2, .hero-bar, .animate-float { animation: none !important; }
      }
    `}</style>
  );
}

/** 3D tilt wrapper with cursor-tracked specular highlight. */
export function Tilt({ children, className = "", glow = "cyan" }) {
  const ref = useRef(null);
  const [style, setStyle] = useState({});
  const [spot, setSpot] = useState({ x: 50, y: 50 });

  const onMove = (e) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setSpot({ x: px * 100, y: py * 100 });
    setStyle({
      transform: `perspective(950px) rotateX(${(0.5 - py) * 9}deg) rotateY(${(px - 0.5) * 11}deg) scale3d(1.02,1.02,1)`,
      transition: "transform 60ms linear",
    });
  };

  const onLeave = () => {
    setStyle({
      transform: "perspective(950px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)",
      transition: "transform 450ms cubic-bezier(0.22,1,0.36,1)",
    });
  };

  return (
    <div style={{ perspective: "950px" }} className={className}>
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ ...style, "--mx": `${spot.x}%`, "--my": `${spot.y}%` }}
        className={`liquid-glass liquid-glass-${glow} relative h-full rounded-3xl border will-change-transform`}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-3xl specular" />
        {children}
      </div>
    </div>
  );
}
