"use client";

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { Mail, Linkedin, Instagram, Facebook, type LucideIcon } from 'lucide-react';
import { useTheme } from './themeprovider';

// ==========================================
// 1. EXPORTED INTERFACES
// ==========================================

export interface ColorSwatch {
  hex: string;
  label: string;
}

export interface SocialLink {
  icon: LucideIcon;
  url: string;
  ariaLabel: string;
}

export interface FooterThemeColors {
  bgLight: string;
  bgDark: string;
  cardBgLight: string;
  cardBgDark: string;
  textLight: string;
  textDark: string;
  accent: string;       // The Tan/Brown color used for buttons/highlights
  accentHover: string;
}

export interface FooterProps {
  /** Logo configuration */
  logoText?: string;
  
  /** Newsletter configuration */
  subscribePlaceholder?: string;
  subscribeButtonText?: string;
  onSubscribe?: (email: string) => void;

  /** Middle section configuration */
  creditsText?: string;
  paletteColors?: ColorSwatch[];

  /** Bottom section configuration */
  copyrightText?: string;
  socialLinks?: SocialLink[];

  /** Theme & Color Overrides */
  themeColors?: Partial<FooterThemeColors>;
}

// ==========================================
// 2. DEFAULT CONFIGURATION
// ==========================================

const DEFAULT_THEME: FooterThemeColors = {
  bgLight: '#f5f3ec',
  bgDark: '#0a1429',
  cardBgLight: '#f5f3ec',
  cardBgDark: '#0f1e3f',
  textLight: '#0f1e3f',
  textDark: '#cdaa80',
  accent: '#997953',
  accentHover: '#856846',
};

const DEFAULT_PALETTE: ColorSwatch[] = [
  { hex: '#0f1e3f', label: '#0f1e3f' },
  { hex: '#213a56', label: '#213a56' },
  { hex: '#cdaa80', label: '#cdaa80' },
  { hex: '#997953', label: '#997953' },
];

const DEFAULT_SOCIALS: SocialLink[] = [
  { icon: Linkedin, url: '#', ariaLabel: 'LinkedIn' },
  { icon: Instagram, url: '#', ariaLabel: 'Instagram' },
  { icon: Facebook, url: '#', ariaLabel: 'Facebook' },
];

// ==========================================
// 3. COMPONENT
// ==========================================

export const Footer: React.FC<FooterProps> = ({
  logoText = "NyayaAI",
  subscribePlaceholder = "Enter your email",
  subscribeButtonText = "Subscribe",
  onSubscribe,
  creditsText = "Intelligent Legal Assistance for Every Indian Citizen.",
  paletteColors = DEFAULT_PALETTE,
  copyrightText = "© 2026 NyayaAI. All rights reserved.",
  socialLinks = DEFAULT_SOCIALS,
  themeColors = {},
}) => {
  const [email, setEmail] = useState("");
  const footerRef = useRef<HTMLDivElement>(null);
  const socialRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const { theme, mounted } = useTheme();

  // Merge default colors with any user-provided overrides
  const colors = { ...DEFAULT_THEME, ...themeColors };

  // Setup CSS Variables for dynamic Tailwind compilation
  const dynamicStyles = {
    '--footer-bg-light': colors.bgLight,
    '--footer-bg-dark': colors.bgDark,
    '--footer-card-light': colors.cardBgLight,
    '--footer-card-dark': colors.cardBgDark,
    '--footer-text-light': colors.textLight,
    '--footer-text-dark': colors.textDark,
    '--footer-accent': colors.accent,
    '--footer-accent-hover': colors.accentHover,
  } as React.CSSProperties;

  // GSAP Fade-in on mount/scroll-into-view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && footerRef.current) {
          gsap.fromTo(
            footerRef.current,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
          );
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (footerRef.current) observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  // GSAP Hover Effects
  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    gsap.to(e.currentTarget, { scale: 1.05, duration: 0.3, ease: 'back.out(1.7)' });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    gsap.to(e.currentTarget, { scale: 1, duration: 0.3, ease: 'power2.out' });
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubscribe && email) onSubscribe(email);
  };

  return (
    <footer
      style={dynamicStyles}
      className="w-full p-2 md:p-4 bg-[var(--footer-bg-light)] dark:bg-[var(--footer-bg-dark)] transition-colors duration-300"
    >
      {/* Inner Card Container */}
      <div
        ref={footerRef}
        className="opacity-0 max-w-6xl mx-auto rounded-3xl border-2 border-[var(--footer-text-light)]/10 dark:border-[var(--footer-text-dark)]/20 p-4 md:p-6 
                   bg-[var(--footer-card-light)] dark:bg-[var(--footer-card-dark)] 
                   text-[var(--footer-text-light)] dark:text-[var(--footer-text-dark)] shadow-sm transition-colors duration-300"
      >

        {/* Top Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-5 pb-5 md:pb-6">
          <div className="flex items-center gap-3">
            {mounted && theme === "dark" ? (
              <span
                aria-hidden="true"
                className="block transition-opacity"
                style={{
                  width: 30,
                  height: 30,
                  backgroundColor: "currentColor",
                  WebkitMaskImage: "url('/balance_512.png')",
                  maskImage: "url('/balance_512.png')",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                }}
              />
            ) : (
              <Image
                src="/balance_512.png"
                alt="NyayaAI Logo"
                width={30}
                height={30}
              />
            )}
            <span className="text-xl md:text-2xl font-serif font-semibold tracking-tight">{logoText}</span>
          </div>

          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
            <div className="relative flex-grow md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="opacity-50" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={subscribePlaceholder}
                className="w-full pl-10 pr-4 py-2 bg-transparent border border-[var(--footer-text-light)] dark:border-[var(--footer-text-dark)] 
                           placeholder-[var(--footer-text-light)]/50 dark:placeholder-[var(--footer-text-dark)]/50 
                           focus:outline-none focus:ring-1 focus:ring-[var(--footer-accent)] transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="bg-[var(--footer-accent)] hover:bg-[var(--footer-accent-hover)] text-white px-5 py-2 font-medium transition-colors"
            >
              {subscribeButtonText}
            </button>
          </form>
        </div>

        {/* Middle Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-5 py-5 md:py-6">
          <h3 className="text-lg md:text-xl font-serif">{creditsText}</h3>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-3 pt-4 md:pt-5">
          <p className="text-sm">{copyrightText}</p>

          <div className="flex items-center gap-4">
            {socialLinks.map((social, index) => {
              const Icon = social.icon;
              return (
                <a
                  key={index}
                  href={social.url}
                  aria-label={social.ariaLabel}
                  ref={(el) => { socialRefs.current[index] = el; }}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  className="p-2 bg-transparent hover:text-[var(--footer-accent)] dark:hover:text-[var(--footer-accent)] transition-colors"
                >
                  <Icon size={20} strokeWidth={2} />
                </a>
              );
            })}
          </div>
        </div>

      </div>
    </footer>
  );
};