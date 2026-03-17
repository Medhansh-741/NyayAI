'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';

interface LiquidSliderProps {
  leftLabel: string;
  rightLabel: string;
  value: 'left' | 'right';
  onChange: (value: 'left' | 'right') => void;
}

export function LiquidSlider({ leftLabel, rightLabel, value, onChange }: LiquidSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const wavePath1 = useRef<SVGPathElement>(null);
  const wavePath2 = useRef<SVGPathElement>(null);
  const wavePath3 = useRef<SVGPathElement>(null);
  const leftLabelRef = useRef<HTMLSpanElement>(null);
  const rightLabelRef = useRef<HTMLSpanElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Idle wave animation — gentle breathing effect on the blob
  useEffect(() => {
    if (!svgRef.current || !wavePath1.current || !wavePath2.current || !wavePath3.current) return;

    // Wave 1 — slow, large
    gsap.to(wavePath1.current, {
      attr: {
        d: value === 'left'
          ? 'M0,25 C30,18 60,32 90,25 C120,18 150,32 180,25 L180,50 L0,50 Z'
          : 'M0,25 C30,32 60,18 90,25 C120,32 150,18 180,25 L180,50 L0,50 Z'
      },
      duration: 2.5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });

    // Wave 2 — medium speed
    gsap.to(wavePath2.current, {
      attr: {
        d: value === 'left'
          ? 'M0,28 C40,22 80,34 120,28 C140,22 160,30 180,28 L180,50 L0,50 Z'
          : 'M0,28 C40,34 80,22 120,28 C140,34 160,26 180,28 L180,50 L0,50 Z'
      },
      duration: 1.8,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: 0.3,
    });

    // Wave 3 — fast, subtle
    gsap.to(wavePath3.current, {
      attr: {
        d: value === 'left'
          ? 'M0,30 C20,26 50,34 80,30 C110,26 150,34 180,30 L180,50 L0,50 Z'
          : 'M0,30 C20,34 50,26 80,30 C110,34 150,26 180,30 L180,50 L0,50 Z'
      },
      duration: 1.2,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: 0.6,
    });
  }, [value]);

  const handleSwitch = useCallback((newValue: 'left' | 'right') => {
    if (isAnimating || newValue === value) return;
    setIsAnimating(true);

    const blob = blobRef.current;
    const glow = glowRef.current;
    const leftEl = leftLabelRef.current;
    const rightEl = rightLabelRef.current;
    if (!blob || !glow || !leftEl || !rightEl) return;

    const isGoingRight = newValue === 'right';
    const tl = gsap.timeline({
      onComplete: () => {
        onChange(newValue);
        setIsAnimating(false);
      }
    });

    // 1. Squish blob (stretch in direction of travel, compress vertically)
    tl.to(blob, {
      scaleX: 1.35,
      scaleY: 0.75,
      duration: 0.15,
      ease: 'power2.in',
    })
    // 2. Slide + wobble glow
    .to(blob, {
      x: isGoingRight ? '100%' : '0%',
      duration: 0.4,
      ease: 'power3.inOut',
    }, '-=0.05')
    .to(glow, {
      x: isGoingRight ? '100%' : '0%',
      opacity: 1,
      duration: 0.4,
      ease: 'power3.inOut',
    }, '<')
    // 3. Overshoot + settle (elastic bounce)
    .to(blob, {
      scaleX: 0.9,
      scaleY: 1.12,
      duration: 0.15,
      ease: 'power2.out',
    })
    .to(blob, {
      scaleX: 1.05,
      scaleY: 0.96,
      duration: 0.12,
      ease: 'sine.inOut',
    })
    .to(blob, {
      scaleX: 1,
      scaleY: 1,
      duration: 0.2,
      ease: 'elastic.out(1.2, 0.4)',
    })
    .to(glow, {
      opacity: 0.5,
      duration: 0.3,
    }, '<');

    // Label color transitions
    tl.to(leftEl, {
      color: isGoingRight ? 'rgba(205,170,128,0.5)' : '#1a1207',
      duration: 0.3,
    }, 0.1);
    tl.to(rightEl, {
      color: isGoingRight ? '#1a1207' : 'rgba(205,170,128,0.5)',
      duration: 0.3,
    }, 0.1);
  }, [isAnimating, value, onChange]);

  const isLeft = value === 'left';

  return (
    <div className="flex items-center justify-center gap-5 select-none" ref={containerRef}>
      {/* Left Label */}
      <span
        ref={leftLabelRef}
        onClick={() => handleSwitch('left')}
        className="text-[15px] md:text-[17px] font-serif font-semibold tracking-wide cursor-pointer transition-colors duration-300 min-w-[130px] text-right"
        style={{ color: isLeft ? '#1a1207' : 'rgba(205,170,128,0.5)' }}
      >
        {leftLabel}
      </span>

      {/* Slider Track */}
      <div
        className="relative w-[200px] h-[52px] rounded-full cursor-pointer overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(15,30,63,0.9) 0%, rgba(10,21,46,0.95) 100%)',
          boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.5), 0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(205,170,128,0.15)',
        }}
        onClick={() => handleSwitch(isLeft ? 'right' : 'left')}
      >
        {/* Inner subtle border highlight */}
        <div className="absolute inset-[1px] rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(205,170,128,0.08) 0%, transparent 50%)',
          }}
        />

        {/* Ambient glow behind blob */}
        <div
          ref={glowRef}
          className="absolute top-1/2 -translate-y-1/2 w-[92px] h-[42px] rounded-full pointer-events-none"
          style={{
            left: '5px',
            transform: `translateX(${isLeft ? '0%' : '100%'}) translateY(-50%)`,
            background: 'radial-gradient(ellipse at center, rgba(205,170,128,0.25) 0%, transparent 70%)',
            filter: 'blur(8px)',
            opacity: 0.5,
          }}
        />

        {/* The Liquid Blob */}
        <div
          ref={blobRef}
          className="absolute top-[5px] left-[5px] w-[92px] h-[42px] rounded-full"
          style={{
            transform: `translateX(${isLeft ? '0%' : 'calc(200px - 92px - 10px)'})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Blob base with golden gradient */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #d4a853 0%, #c49a45 30%, #b8893c 60%, #a67830 100%)',
              boxShadow: '0 2px 12px rgba(196,154,69,0.4), inset 0 1px 2px rgba(255,220,150,0.3), inset 0 -1px 2px rgba(0,0,0,0.15)',
            }}
          />

          {/* Metallic sheen overlay */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(180deg, rgba(255,230,160,0.35) 0%, rgba(255,230,160,0.05) 40%, transparent 60%, rgba(0,0,0,0.08) 100%)',
            }}
          />

          {/* SVG Liquid Waves */}
          <svg
            ref={svgRef}
            viewBox="0 0 180 50"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full rounded-full overflow-hidden"
            style={{ mixBlendMode: 'soft-light' }}
          >
            <defs>
              <clipPath id="blobClip">
                <rect x="0" y="0" width="180" height="50" rx="25" ry="25" />
              </clipPath>
            </defs>
            <g clipPath="url(#blobClip)">
              {/* Wave Layer 1 — deep, slow */}
              <path
                ref={wavePath1}
                d="M0,30 C30,24 60,36 90,30 C120,24 150,36 180,30 L180,50 L0,50 Z"
                fill="rgba(255,240,200,0.12)"
              />
              {/* Wave Layer 2 — mid-depth */}
              <path
                ref={wavePath2}
                d="M0,32 C40,28 80,36 120,32 C140,28 160,34 180,32 L180,50 L0,50 Z"
                fill="rgba(255,230,180,0.1)"
              />
              {/* Wave Layer 3 — surface, fast */}
              <path
                ref={wavePath3}
                d="M0,34 C20,30 50,38 80,34 C110,30 150,38 180,34 L180,50 L0,50 Z"
                fill="rgba(255,245,220,0.08)"
              />
            </g>
          </svg>

          {/* Subtle floating particles */}
          <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
            <div className="liquid-particle absolute w-1 h-1 rounded-full bg-white/20" style={{ top: '35%', left: '20%' }} />
            <div className="liquid-particle absolute w-0.5 h-0.5 rounded-full bg-white/15" style={{ top: '55%', left: '60%' }} />
            <div className="liquid-particle absolute w-[3px] h-[3px] rounded-full bg-white/10" style={{ top: '40%', left: '75%' }} />
          </div>
        </div>
      </div>

      {/* Right Label */}
      <span
        ref={rightLabelRef}
        onClick={() => handleSwitch('right')}
        className="text-[15px] md:text-[17px] font-serif font-semibold tracking-wide cursor-pointer transition-colors duration-300 min-w-[130px] text-left"
        style={{ color: isLeft ? 'rgba(205,170,128,0.5)' : '#1a1207' }}
      >
        {rightLabel}
      </span>

      {/* Particle floating animation keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes liquidFloat {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.2; }
          25% { transform: translateY(-3px) translateX(2px); opacity: 0.4; }
          50% { transform: translateY(-1px) translateX(-1px); opacity: 0.15; }
          75% { transform: translateY(-4px) translateX(1px); opacity: 0.35; }
        }
        .liquid-particle:nth-child(1) { animation: liquidFloat 3s ease-in-out infinite; }
        .liquid-particle:nth-child(2) { animation: liquidFloat 2.5s ease-in-out infinite 0.5s; }
        .liquid-particle:nth-child(3) { animation: liquidFloat 3.5s ease-in-out infinite 1s; }
      `}} />
    </div>
  );
}
