"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useTheme } from "./themeprovider";
import ThemeToggle from "./Themetogglebutton";
import LoginButton from "./login-button";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

// ... [Keep your EXPORTED INTERFACES and DEFAULT_THEME exactly the same here] ...

export interface NavItem {
  label: string;
  href: string;
}

export interface HeaderThemeColors {
  light: { bgInitial: string; bgScrolled: string; textInitial: string; textScrolled: string; };
  dark: { bgInitial: string; bgScrolled: string; textInitial: string; textScrolled: string; };
}

export interface HeaderProps {
  logoText?: string;
  navLinks?: NavItem[];
  rightAction?: React.ReactNode;
  rightIcon?: React.ReactNode;
  themeColors?: HeaderThemeColors;
}

const DEFAULT_THEME: HeaderThemeColors = {
  light: {
    bgInitial: "transparent",
    bgScrolled: "#F5F0E8",
    textInitial: "#443831",
    textScrolled: "#443831",
  },
  dark: {
    bgInitial: "transparent",
    bgScrolled: "#0f1e3f",
    textInitial: "#E8E2D6",
    textScrolled: "#E8E2D6",
  },
};

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];



export default function Header({
  logoText = "NyayaAI",
  navLinks = DEFAULT_NAV_ITEMS,
  rightAction,
  rightIcon,
  themeColors = DEFAULT_THEME,
}: HeaderProps) {
  const headerRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuItemRefsRef = useRef<(HTMLElement | null)[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, mounted } = useTheme();

  // Resolve current theme colors based on app context
  const resolvedTheme = mounted && theme === 'dark' ? themeColors.dark : themeColors.light;

  // 1. FIXED ENTRANCE ANIMATION
  // We added `mounted` to the dependency array so GSAP waits until the DOM actually exists
  useGSAP(() => {
    if (!mounted || !headerRef.current) return;

    gsap.fromTo(
      headerRef.current,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, delay: 0.1, ease: "power3.out" }
    );
  }, [mounted]);

  // 2. FIXED SCROLL ANIMATION: Sliding background (Desktop only)
  useGSAP(() => {
    if (!mounted || !headerRef.current || !bgRef.current) return;

    const atTop = window.scrollY <= 50;

    // Set initial accurate states
    gsap.set(headerRef.current, {
      color: atTop ? resolvedTheme.textInitial : resolvedTheme.textScrolled,
    });
    gsap.set(bgRef.current, {
      scaleY: atTop ? 0 : 1,
    });

    const anim = gsap.timeline({
      paused: true,
    });

    // Animate the background sliding down
    anim.to(bgRef.current, {
      scaleY: 1,
      duration: 0.5,
      ease: "power3.out",
    }, 0);

    // Animate the text color
    anim.to(headerRef.current, {
      color: resolvedTheme.textScrolled,
      duration: 0.3,
      ease: "power2.out",
    }, 0);

    if (window.scrollY > 50) {
      anim.progress(1);
    }

    const st = ScrollTrigger.create({
      start: 50,
      onEnter: () => {
        anim.play();
        headerRef.current?.classList.add("shadow-sm");
      },
      onLeaveBack: () => {
        anim.reverse();
        headerRef.current?.classList.remove("shadow-sm");
      },
    });

    return () => {
      st.kill();
      anim.kill();
    };
  }, [mounted, resolvedTheme]); // Re-run if theme flips between dark/light

  // 3. MOBILE MENU ANIMATION: Smooth background color transition on mobile
  useGSAP(() => {
    if (!mounted || !headerRef.current) return;

    gsap.to(headerRef.current, {
      backgroundColor: isMobileMenuOpen ? resolvedTheme.bgScrolled : "transparent",
      color: isMobileMenuOpen ? resolvedTheme.textScrolled : resolvedTheme.textInitial,
      duration: 0.3,
      ease: "power2.out",
    });
  }, [isMobileMenuOpen, mounted, resolvedTheme]);

  // 4. MOBILE MENU EXPANSION ANIMATION: Smooth slide-down and stagger items
  useGSAP(() => {
    if (!mounted || !mobileMenuRef.current) return;

    const menuOverlay = mobileMenuRef.current;
    const menuItems = menuItemRefsRef.current.filter(Boolean);

    if (isMobileMenuOpen) {
      // Opening animation
      gsap.fromTo(
        menuOverlay,
        {
          height: 0,
          opacity: 0,
          pointerEvents: "none",
        },
        {
          height: "auto",
          opacity: 1,
          pointerEvents: "auto",
          duration: 0.4,
          ease: "power3.out",
        }
      );

      // Stagger animation for menu items
      gsap.fromTo(
        menuItems,
        {
          opacity: 0,
          y: -10,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          stagger: 0.08,
          ease: "power2.out",
          delay: 0.1,
        }
      );
    } else {
      // Closing animation
      gsap.to(menuItems, {
        opacity: 0,
        y: -10,
        duration: 0.2,
        stagger: 0.04,
        ease: "power2.in",
      });

      gsap.to(
        menuOverlay,
        {
          height: 0,
          opacity: 0,
          pointerEvents: "none",
          duration: 0.3,
          ease: "power3.in",
          delay: 0.1,
        }
      );
    }
  }, [isMobileMenuOpen, mounted]);

  // Prevent hydration mismatch
  if (!mounted) return null;

  return (
    <header
      ref={headerRef}
      style={{
        color: resolvedTheme.textInitial,
        opacity: 0 // GSAP will take over and animate this to 1
      }}
      className="fixed top-0 left-0 w-full z-50 transition-shadow duration-300"
    >
      {/* Animated Sliding Background - Only on Desktop */}
      <div
        ref={bgRef}
        className="absolute inset-0 w-full h-full -z-10 origin-top shadow-md hidden md:block"
        style={{ backgroundColor: resolvedTheme.bgScrolled, transform: 'scaleY(0)' }}
      />

      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Left Side: Theme Toggle & Text Logo with Balance Logo */}
        <div className="flex items-center gap-4">
          <div className="hidden md:block scale-75 origin-left">
            <ThemeToggle />
          </div>
          <Link href="/" className="group flex items-center gap-2 whitespace-nowrap">
            {theme === "dark" ? (
              <span
                aria-hidden="true"
                className="block group-hover:opacity-70 transition-opacity flex-shrink-0"
                style={{
                  width: 40,
                  height: 40,
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
                width={40}
                height={40}
                className="group-hover:opacity-70 transition-opacity flex-shrink-0"
              />
            )}
            <span className="font-serif text-3xl font-medium tracking-tight group-hover:opacity-70 transition-opacity">
              {logoText}
            </span>
          </Link>
        </div>

        {/* Center: Empty spacer */}
        <div className="flex-1"></div>

        {/* Right Side */}
        <div className="flex items-center gap-6">
          {/* Desktop Nav Links - Moved to right side */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-widest uppercase">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className="hover:opacity-60 transition-opacity relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-current transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          {rightAction && (
            <div className="hidden md:block scale-75">
              {rightAction}
            </div>
          )}

          <div className="hidden md:block">
            {rightIcon || <LoginButton hoverTextColor={resolvedTheme.bgScrolled} />}
          </div>

          <button
            className="md:hidden flex flex-col gap-1.5 z-50 p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className={`block w-6 h-0.5 bg-current transition-transform ${isMobileMenuOpen ? "rotate-45 translate-y-2" : ""}`}></span>
            <span className={`block w-6 h-0.5 bg-current transition-opacity ${isMobileMenuOpen ? "opacity-0" : ""}`}></span>
            <span className={`block w-6 h-0.5 bg-current transition-transform ${isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}></span>
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        {isMobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden absolute top-full left-0 w-full py-6 px-6 flex flex-col gap-4 shadow-lg border-t border-black/10 overflow-hidden"
            style={{
              backgroundColor: resolvedTheme.bgScrolled,
              color: resolvedTheme.textScrolled,
            }}
          >
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                ref={(el) => {
                  if (el) menuItemRefsRef.current[idx] = el;
                }}
                href={link.href}
                className="text-sm font-medium tracking-widest uppercase"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div
              ref={(el) => {
                if (el) menuItemRefsRef.current[navLinks.length] = el;
              }}
              className="mt-4 flex items-center justify-center gap-4 border-t border-current/10 pt-4"
            >
              <div className="scale-90">
                <ThemeToggle />
              </div>
              {rightIcon || <LoginButton hoverTextColor={resolvedTheme.bgScrolled} />}
            </div>

            {rightAction && (
              <div
                ref={(el) => {
                  if (el) menuItemRefsRef.current[navLinks.length + 1] = el;
                }}
                className="mt-4 pt-4 border-t border-current/10"
              >
                {rightAction}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}