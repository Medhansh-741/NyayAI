"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTheme } from "./themeprovider";

// 1. Exported interface for complete color control
export interface ToggleColors {
  dayBg: string;
  nightBg: string;
  knobDay: string;
  knobNight: string;
  cloudDay: string;
  cloudNight: string;
  stars: string;
  border: string;
}

export interface ThemeToggleProps {
  colors?: ToggleColors;
}

// Mapped exactly to the 5-color palette you provided
const defaultColors: ToggleColors = {
  dayBg: "#F5F0E8",      // Parchment Background
  nightBg: "#0f1e3f",    // Dark Navy
  knobDay: "#C7AB88",    // Golden-Tan Accent (Sun)
  knobNight: "#cdaa80",  // Tan (Moon)
  cloudDay: "#D6CDC3",   // Light Grey-Beige for better visibility
  cloudNight: "#213a56", // Slate Blue
  stars: "#997953",      // Light Brown
  border: "#443831",     // Deep Charcoal Text
};

export default function ThemeToggle({
  colors = defaultColors,
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Refs for GSAP animation
  const containerRef = useRef<HTMLButtonElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const moonCratersRef = useRef<HTMLDivElement>(null);
  const dayElementsRef = useRef<HTMLDivElement>(null);
  const nightElementsRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // 2. GSAP Animations for the toggle states
  useGSAP(() => {
    if (!containerRef.current || !knobRef.current) return;

    const tl = gsap.timeline();

    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (isDark) {
        gsap.set(containerRef.current, { backgroundColor: colors.nightBg });
        gsap.set(knobRef.current, { x: 0, backgroundColor: colors.knobNight });
        gsap.set(moonCratersRef.current, { opacity: 1, scale: 1 });
        gsap.set(dayElementsRef.current, { y: 30, opacity: 0 });
        gsap.set(nightElementsRef.current, { y: 0, opacity: 1 });
      } else {
        gsap.set(containerRef.current, { backgroundColor: colors.dayBg });
        gsap.set(knobRef.current, { x: 80, backgroundColor: colors.knobDay });
        gsap.set(moonCratersRef.current, { opacity: 0, scale: 0.5 });
        gsap.set(nightElementsRef.current, { y: -30, opacity: 0 });
        gsap.set(dayElementsRef.current, { y: 0, opacity: 1 });
      }
      return;
    }

    if (isDark) {
      // Animate to Night State
      tl.to(containerRef.current, { backgroundColor: colors.nightBg, duration: 0.5, ease: "power2.inOut" }, 0)
        .to(knobRef.current, { x: 0, backgroundColor: colors.knobNight, duration: 0.6, ease: "back.out(1.2)" }, 0)
        .to(moonCratersRef.current, { opacity: 1, scale: 1, duration: 0.4, ease: "power1.out" }, 0.2)
        .to(dayElementsRef.current, { y: 30, opacity: 0, duration: 0.4, ease: "power2.in" }, 0)
        .fromTo(nightElementsRef.current, { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, 0.2);
    } else {
      // Animate to Day State
      // Calculate knob travel distance: w-32 (128px) - p-1 (8px padding total) - knob w-10 (40px) = 80px travel
      tl.to(containerRef.current, { backgroundColor: colors.dayBg, duration: 0.5, ease: "power2.inOut" }, 0)
        .to(knobRef.current, { x: 80, backgroundColor: colors.knobDay, duration: 0.6, ease: "back.out(1.2)" }, 0)
        .to(moonCratersRef.current, { opacity: 0, scale: 0.5, duration: 0.3, ease: "power1.in" }, 0)
        .to(nightElementsRef.current, { y: -30, opacity: 0, duration: 0.4, ease: "power2.in" }, 0)
        .fromTo(dayElementsRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, 0.2);
    }
  }, [isDark, colors]);

  return (
    <button
      ref={containerRef}
      onClick={toggleTheme}
      className="relative w-32 h-12 rounded-full overflow-hidden p-1 border-4 shadow-inner transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={{ borderColor: colors.border }}
      aria-label="Toggle Dark Mode"
    >
      {/* --- Night Elements (Stars & Dark Clouds) --- */}
      <div ref={nightElementsRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-0">
        {/* Stars */}
        <div className="absolute top-2 left-16 w-1 h-1 rounded-full" style={{ backgroundColor: colors.stars }} />
        <div className="absolute top-4 left-20 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.stars }} />
        <div className="absolute top-3 left-26 w-1 h-1 rounded-full" style={{ backgroundColor: colors.stars }} />

        {/* Night Clouds */}
        <div className="absolute -bottom-2 right-2 w-12 h-6 rounded-full" style={{ backgroundColor: colors.cloudNight }} />
        <div className="absolute bottom-0 right-8 w-10 h-8 rounded-full" style={{ backgroundColor: colors.cloudNight }} />
      </div>

      {/* --- Day Elements (Light Clouds) --- */}
      <div ref={dayElementsRef} className="absolute inset-0 w-full h-full pointer-events-none">
        {/* Day Clouds */}
        <div className="absolute bottom-0 left-2 w-12 h-6 rounded-full" style={{ backgroundColor: colors.cloudDay }} />
        <div className="absolute -bottom-1 left-8 w-14 h-8 rounded-full" style={{ backgroundColor: colors.cloudDay }} />
        <div className="absolute bottom-1 left-16 w-8 h-5 rounded-full" style={{ backgroundColor: colors.cloudDay }} />

        {/* Birds (Simple SVG paths) */}
        <svg className="absolute top-3 right-6 w-4 h-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke={colors.border} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12h10l-3-3m0 6l3-3" />
        </svg>
      </div>

      {/* --- The Knob (Sun / Moon) --- */}
      <div
        ref={knobRef}
        className="relative w-9 h-9 rounded-full shadow-md z-10 flex items-center justify-center overflow-hidden"
      >
        {/* Moon Craters (Only visible in dark mode) */}
        <div ref={moonCratersRef} className="absolute inset-0 w-full h-full opacity-0">
          <div className="absolute top-1 left-2 w-2 h-2 rounded-full bg-black/10 shadow-inner" />
          <div className="absolute bottom-2 left-1 w-3 h-3 rounded-full bg-black/10 shadow-inner" />
          <div className="absolute top-4 right-1 w-1.5 h-1.5 rounded-full bg-black/10 shadow-inner" />
        </div>
      </div>
    </button>
  );
}