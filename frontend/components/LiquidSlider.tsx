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
  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leftLabelRef = useRef<HTMLSpanElement>(null);
  const rightLabelRef = useRef<HTMLSpanElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const animFrameRef = useRef<number>(0);

  // Water simulation state
  const waterRef = useRef({
    // Position of the liquid mass center (0 = left, 1 = right)
    position: value === 'left' ? 0 : 1,
    velocity: 0,
    // Array of wave amplitudes for surface ripples
    wavePoints: new Array(60).fill(0),
    waveVelocities: new Array(60).fill(0),
    // Splash particles
    splashes: [] as { x: number; y: number; vx: number; vy: number; life: number; size: number }[],
    // Idle wave phase
    idlePhase: 0,
  });

  // ── Canvas rendering loop ──────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = 240;
    const H = 60;
    canvas.width = W * 2; // retina
    canvas.height = H * 2;
    ctx.scale(2, 2);

    const water = waterRef.current;
    const DAMPING = 0.92;
    const SPREAD = 0.15;
    const TENSION = 0.012;

    function render() {
      ctx.clearRect(0, 0, W, H);

      // Update wave physics
      const numPoints = water.wavePoints.length;
      for (let i = 0; i < numPoints; i++) {
        // Spring force toward 0
        const force = -TENSION * water.wavePoints[i];
        water.waveVelocities[i] += force;
        water.waveVelocities[i] *= DAMPING;
        water.wavePoints[i] += water.waveVelocities[i];
      }

      // Spread waves between neighbors (multiple passes for smooth propagation)
      for (let pass = 0; pass < 3; pass++) {
        const deltas = new Array(numPoints).fill(0);
        for (let i = 0; i < numPoints; i++) {
          if (i > 0) {
            deltas[i] += SPREAD * (water.wavePoints[i] - water.wavePoints[i - 1]);
            water.waveVelocities[i - 1] += SPREAD * (water.wavePoints[i] - water.wavePoints[i - 1]);
          }
          if (i < numPoints - 1) {
            deltas[i] += SPREAD * (water.wavePoints[i] - water.wavePoints[i + 1]);
            water.waveVelocities[i + 1] += SPREAD * (water.wavePoints[i] - water.wavePoints[i + 1]);
          }
        }
        for (let i = 0; i < numPoints; i++) {
          water.wavePoints[i] -= deltas[i] * 0.5;
        }
      }

      // Idle wave animation (gentle sloshing)
      water.idlePhase += 0.02;

      // Compute liquid position on track
      const liquidX = 8 + water.position * (W - 112);
      const liquidW = 96;
      const liquidH = 44;
      const liquidY = (H - liquidH) / 2;
      const liquidR = liquidH / 2;

      // ── Draw liquid body with wave surface ──────────────
      // Create the liquid shape path
      ctx.save();

      // Draw filled liquid body
      const gradient = ctx.createLinearGradient(liquidX, liquidY, liquidX, liquidY + liquidH);
      gradient.addColorStop(0, '#e8c06a');
      gradient.addColorStop(0.3, '#d4a853');
      gradient.addColorStop(0.7, '#c49a45');
      gradient.addColorStop(1, '#a67830');

      ctx.beginPath();

      // Build wave-surfaced shape
      const surfaceY = liquidY + 6; // Where waves sit
      const baseY = liquidY + liquidH;

      // Start from bottom-left with rounded corner
      ctx.moveTo(liquidX + liquidR, baseY);
      ctx.lineTo(liquidX + liquidW - liquidR, baseY);
      // Bottom-right rounded corner
      ctx.arc(liquidX + liquidW - liquidR, baseY - liquidR, liquidR, Math.PI / 2, 0, true);
      // Right side up to wave surface
      ctx.lineTo(liquidX + liquidW, surfaceY + 4);

      // Top surface with wave displacement
      for (let i = numPoints - 1; i >= 0; i--) {
        const t = i / (numPoints - 1);
        const wx = liquidX + t * liquidW;
        // Combine wave simulation with idle sloshing
        const idle = Math.sin(water.idlePhase + t * Math.PI * 3) * 1.2
          + Math.sin(water.idlePhase * 0.7 + t * Math.PI * 5) * 0.6;
        const waveDisplacement = water.wavePoints[i] + idle;
        const wy = surfaceY + waveDisplacement;
        if (i === numPoints - 1) {
          ctx.lineTo(wx, wy);
        } else {
          // Smooth curve between points
          const nextT = (i + 1) / (numPoints - 1);
          const nextX = liquidX + nextT * liquidW;
          const nextIdle = Math.sin(water.idlePhase + nextT * Math.PI * 3) * 1.2
            + Math.sin(water.idlePhase * 0.7 + nextT * Math.PI * 5) * 0.6;
          const nextY = surfaceY + water.wavePoints[i + 1] + nextIdle;
          const cpx = (wx + nextX) / 2;
          ctx.quadraticCurveTo(nextX, nextY, cpx, (wy + nextY) / 2);
        }
      }

      // Left side down
      ctx.lineTo(liquidX, surfaceY + 4);
      // Bottom-left rounded corner
      ctx.arc(liquidX + liquidR, baseY - liquidR, liquidR, Math.PI, Math.PI / 2, true);

      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // ── Light reflection on surface ─────────────────────
      ctx.beginPath();
      for (let i = 0; i < numPoints; i++) {
        const t = i / (numPoints - 1);
        const wx = liquidX + t * liquidW;
        const idle = Math.sin(water.idlePhase + t * Math.PI * 3) * 1.2
          + Math.sin(water.idlePhase * 0.7 + t * Math.PI * 5) * 0.6;
        const wy = surfaceY + water.wavePoints[i] + idle;
        if (i === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.strokeStyle = 'rgba(255, 240, 200, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // ── Highlight (specular reflection) ─────────────────
      const highlightGrad = ctx.createLinearGradient(liquidX, liquidY, liquidX, liquidY + liquidH * 0.4);
      highlightGrad.addColorStop(0, 'rgba(255, 245, 210, 0.45)');
      highlightGrad.addColorStop(1, 'rgba(255, 245, 210, 0)');

      ctx.beginPath();
      ctx.ellipse(liquidX + liquidW / 2, surfaceY + 8, liquidW * 0.35, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = highlightGrad;
      ctx.fill();

      // ── Splash particles ────────────────────────────────
      ctx.fillStyle = '#e8c06a';
      for (let i = water.splashes.length - 1; i >= 0; i--) {
        const p = water.splashes[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.life -= 0.02;
        if (p.life <= 0) {
          water.splashes.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life * 0.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // ── Caustic light ripples inside liquid ─────────────
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 5; i++) {
        const cx = liquidX + 15 + i * (liquidW - 30) / 4;
        const cy = liquidY + liquidH * 0.55 + Math.sin(water.idlePhase * 1.3 + i * 1.8) * 3;
        const cr = 3 + Math.sin(water.idlePhase * 0.9 + i * 2.5) * 1.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy, cr * 1.5, cr, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    }

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // ── Handle switch ──────────────────────────────────────
  const handleSwitch = useCallback((newValue: 'left' | 'right') => {
    if (isAnimating || newValue === value) return;
    setIsAnimating(true);

    const water = waterRef.current;
    const isGoingRight = newValue === 'right';
    const targetPos = isGoingRight ? 1 : 0;

    // Spawn splash particles at current position
    const spawnX = 8 + water.position * (240 - 112) + 48;
    for (let i = 0; i < 8; i++) {
      water.splashes.push({
        x: spawnX + (Math.random() - 0.5) * 40,
        y: 12 + Math.random() * 5,
        vx: (isGoingRight ? 1 : -1) * (Math.random() * 2 + 1),
        vy: -(Math.random() * 3 + 1.5),
        life: 0.6 + Math.random() * 0.4,
        size: 1.5 + Math.random() * 2,
      });
    }

    // Agitate waves dramatically — simulate water sloshing
    const numPoints = water.wavePoints.length;
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      // Create a directional wave — water piles up on the leading edge
      const dirForce = isGoingRight
        ? Math.sin(t * Math.PI) * 6  // Forward wave
        : Math.sin((1 - t) * Math.PI) * 6;
      water.waveVelocities[i] += dirForce * (0.5 + Math.random() * 0.5);
    }

    // Animate position with GSAP
    gsap.to(water, {
      position: targetPos,
      duration: 0.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        // Keep agitating waves during movement
        const progress = Math.abs(water.position - (isGoingRight ? 0 : 1));
        const center = Math.floor(progress * (numPoints - 1));
        // Disturb wave at leading edge
        const leadIdx = isGoingRight
          ? Math.min(center + 10, numPoints - 1)
          : Math.max(center - 10, 0);
        if (water.wavePoints[leadIdx] !== undefined) {
          water.waveVelocities[leadIdx] += (isGoingRight ? -2 : 2) * (0.3 + Math.random() * 0.4);
        }
      },
      onComplete: () => {
        // Arrival splash — ripple from impact side
        const impactIdx = isGoingRight ? numPoints - 5 : 5;
        for (let i = -4; i <= 4; i++) {
          const idx = impactIdx + i;
          if (idx >= 0 && idx < numPoints) {
            water.waveVelocities[idx] += (4 - Math.abs(i)) * 1.5;
          }
        }
        // More splash particles at landing
        const landX = 8 + targetPos * (240 - 112) + 48;
        for (let i = 0; i < 6; i++) {
          water.splashes.push({
            x: landX + (Math.random() - 0.5) * 30,
            y: 10 + Math.random() * 4,
            vx: (Math.random() - 0.5) * 3,
            vy: -(Math.random() * 2.5 + 1),
            life: 0.5 + Math.random() * 0.3,
            size: 1 + Math.random() * 1.5,
          });
        }

        onChange(newValue);
        setIsAnimating(false);
      },
    });

    // Label color transitions
    const leftEl = leftLabelRef.current;
    const rightEl = rightLabelRef.current;
    if (leftEl && rightEl) {
      gsap.to(leftEl, {
        color: isGoingRight ? 'rgba(205,170,128,0.5)' : '#cdaa80',
        duration: 0.35,
      });
      gsap.to(rightEl, {
        color: isGoingRight ? '#cdaa80' : 'rgba(205,170,128,0.5)',
        duration: 0.35,
      });
    }
  }, [isAnimating, value, onChange]);

  const isLeft = value === 'left';

  return (
    <div className="flex items-center justify-center gap-5 select-none">
      {/* Left Label */}
      <span
        ref={leftLabelRef}
        onClick={() => handleSwitch('left')}
        className="text-[15px] md:text-[17px] font-serif font-semibold tracking-wide cursor-pointer transition-colors duration-300 min-w-[130px] text-right"
        style={{ color: isLeft ? '#cdaa80' : 'rgba(205,170,128,0.5)' }}
      >
        {leftLabel}
      </span>

      {/* Slider Track */}
      <div
        ref={trackRef}
        className="relative w-[240px] h-[60px] rounded-full cursor-pointer overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(8,18,40,0.95) 0%, rgba(12,24,50,0.98) 100%)',
          boxShadow: 'inset 0 3px 16px rgba(0,0,0,0.6), inset 0 -2px 8px rgba(0,0,0,0.3), 0 4px 24px rgba(0,0,0,0.35), 0 0 0 1px rgba(205,170,128,0.12)',
        }}
        onClick={() => handleSwitch(isLeft ? 'right' : 'left')}
      >
        {/* Inner glass edge */}
        <div className="absolute inset-[1px] rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(205,170,128,0.06) 0%, transparent 40%)',
          }}
        />

        {/* Canvas for water simulation */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ borderRadius: '9999px' }}
        />
      </div>

      {/* Right Label */}
      <span
        ref={rightLabelRef}
        onClick={() => handleSwitch('right')}
        className="text-[15px] md:text-[17px] font-serif font-semibold tracking-wide cursor-pointer transition-colors duration-300 min-w-[130px] text-left"
        style={{ color: isLeft ? 'rgba(205,170,128,0.5)' : '#cdaa80' }}
      >
        {rightLabel}
      </span>
    </div>
  );
}
