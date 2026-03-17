"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { Menu, Home, Compass, Gavel, Store, HelpCircle, Sun, Moon, type LucideIcon } from 'lucide-react';
import { useTheme } from './themeprovider'; // Adjust path to your ThemeProvider

// ==========================================
// 1. EXPORTED INTERFACES
// ==========================================

export interface NavItem {
  id: string;
  icon: LucideIcon;
  label?: string;
  href?: string;
  onClick?: () => void;
}

export interface SidebarThemeColors {
  bgLight: string;
  bgDark: string;
  textLight: string;
  textDark: string;
  hoverBgLight: string;
  hoverBgDark: string;
}

export interface SidebarProps {
  /** Array of main navigation items */
  navItems?: NavItem[];

  /** Configuration for the bottom/end of the sidebar */
  showThemeToggle?: boolean;
  showHelpIcon?: boolean;
  helpIcon?: LucideIcon;
  onHelpClick?: () => void;

  /** Theme & Color Overrides */
  themeColors?: Partial<SidebarThemeColors>;
}

// ==========================================
// 2. DEFAULT CONFIGURATION
// ==========================================

const DEFAULT_THEME: SidebarThemeColors = {
  bgLight: '#cdaa80',
  bgDark: '#0f1e3f',
  textLight: '#0f1e3f',
  textDark: '#cdaa80',
  // Using explicit rgba/hex for hover ensures we don't rely on Tailwind's opacity modifiers failing on dynamic variables
  hoverBgLight: 'rgba(15, 30, 63, 0.1)',   // #0f1e3f at 10%
  hoverBgDark: 'rgba(205, 170, 128, 0.1)', // #cdaa80 at 10%
};

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: 'menu', icon: Menu, label: 'Menu' },
  { id: 'home', icon: Home, label: 'Home', href: '/citizen/home' },
  { id: 'explore', icon: Compass, label: 'Explore', href: '/citizen/explore' },
  { id: 'cases', icon: Gavel, label: 'Cases', href: '/citizen/cases' },
  { id: 'marketplace', icon: Store, label: 'Marketplace', href: '/citizen/market_place' },
];

// ==========================================
// 3. COMPONENT
// ==========================================

export const Sidebar: React.FC<SidebarProps> = ({
  navItems = DEFAULT_NAV_ITEMS,
  showThemeToggle = true,
  showHelpIcon = false,
  helpIcon: HelpIcon = HelpCircle,
  onHelpClick,
  themeColors = {},
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Restore expanded state from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebarExpanded');
      if (stored === 'true') {
        setIsExpanded(true);
      }
    }
  }, []);
  const sidebarRef = useRef<HTMLElement>(null);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const themeIconRef = useRef<HTMLDivElement | null>(null);
  const expandTlRef = useRef<gsap.core.Timeline | null>(null);

  const router = useRouter();
  const { theme, toggleTheme, mounted } = useTheme();

  // Merge default colors with any user-provided overrides
  const colors = { ...DEFAULT_THEME, ...themeColors };

  // Setup CSS Variables for dynamic styling
  const dynamicStyles = {
    '--sb-bg-light': colors.bgLight,
    '--sb-bg-dark': colors.bgDark,
    '--sb-text-light': colors.textLight,
    '--sb-text-dark': colors.textDark,
    '--sb-hover-light': colors.hoverBgLight,
    '--sb-hover-dark': colors.hoverBgDark,
  } as React.CSSProperties;

  useEffect(() => {
    const bottomActionsCount = (showThemeToggle ? 1 : 0) + (showHelpIcon ? 1 : 0);
    iconRefs.current.length = navItems.length + bottomActionsCount;
    labelRefs.current.length = navItems.length + bottomActionsCount;
  }, [navItems.length, showThemeToggle, showHelpIcon]);

  // GSAP Entrance Animations
  useLayoutEffect(() => {
    if (!mounted || !sidebarRef.current) return;

    const ctx = gsap.context(() => {
      const validRefs = iconRefs.current.filter(Boolean);
      gsap.set(validRefs, { transformOrigin: '50% 50%' });

      const tl = gsap.timeline();
      tl.fromTo(
        sidebarRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }
      ).fromTo(
        validRefs,
        { x: -20, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.5,
          ease: 'power3.out',
          overwrite: 'auto',
        },
        '-=0.2'
      );
    }, sidebarRef);

    return () => ctx.revert();
  }, [navItems.length, showThemeToggle, mounted]);

  // Setup reusable timeline for expanding/collapsing on desktop
  useLayoutEffect(() => {
    if (!mounted || !sidebarRef.current) return;

    const mm = gsap.matchMedia();

    mm.add('(min-width: 768px)', () => {
      const labels = labelRefs.current.filter(Boolean);

      const tl = gsap.timeline({ paused: true });

      tl.to(sidebarRef.current, {
        width: 240,
        duration: 0.45,
        ease: 'power3.inOut',
      }, 0);

      tl.to(labels, {
        opacity: 1,
        maxWidth: 150,
        marginLeft: 16,
        duration: 0.35,
        ease: 'power2.inOut',
        stagger: 0.02,
      }, 0);

      expandTlRef.current = tl;

      // Handle initial state if resized while expanded
      if (isExpanded) {
        tl.progress(1);
      }
    });

    return () => {
      mm.revert();
      expandTlRef.current = null;
    };
  }, [mounted]); // Only run on mount or when theme makes it "mounted"

  // Play or reverse the timeline based on state
  useEffect(() => {
    if (expandTlRef.current) {
      if (isExpanded) {
        expandTlRef.current.play();
      } else {
        expandTlRef.current.reverse();
      }
    }
  }, [isExpanded]);

  // GSAP Hover Effects
  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.killTweensOf(e.currentTarget);
    gsap.to(e.currentTarget, { scale: 1.12, duration: 0.22, ease: 'power2.out', overwrite: 'auto' });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.killTweensOf(e.currentTarget);
    gsap.to(e.currentTarget, { scale: 1, duration: 0.22, ease: 'power2.out', overwrite: 'auto' });
  };

  const handleThemeToggle = () => {
    if (themeIconRef.current) {
      gsap.to(themeIconRef.current, {
        rotate: theme === 'dark' ? 0 : 35,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }
    toggleTheme();
  };

  const handleMenuToggle = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebarExpanded', String(next));
      }
      return next;
    });
  };

  return (
    <aside
      ref={sidebarRef}
      style={dynamicStyles}
      className={`
        fixed bottom-0 w-full h-16 flex-row rounded-t-3xl overflow-x-auto shadow-xl z-50 py-2 px-4
        md:relative md:h-full md:flex-col md:rounded-none md:shadow-none md:py-10 md:px-0 md:overflow-visible
        flex justify-between items-center 
        bg-[var(--sb-bg-light)] dark:bg-[var(--sb-bg-dark)] 
        text-[var(--sb-text-light)] dark:text-[var(--sb-text-dark)] 
        transition-colors duration-300 ease-in-out md:w-[90px]
      `}
    >
      {/* Top / Main Navigation Items */}
      <div className="flex md:flex-col items-center md:items-start gap-6 md:gap-8 w-full justify-around md:justify-start md:px-[25px]">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isMenuTop = item.id === 'menu';
          return (
            <div
              key={item.id}
              ref={(el) => { iconRefs.current[index] = el; }}
              onClick={() => {
                if (isMenuTop) {
                  handleMenuToggle();
                  return;
                }

                if (item.href) {
                  router.push(item.href);
                }

                if (item.onClick) {
                  item.onClick();
                }
              }}
              title={item.label}
              className={`
                cursor-pointer p-2 rounded-xl transition-colors duration-300 flex items-center
                hover:bg-[var(--sb-hover-light)] dark:hover:bg-[var(--sb-hover-dark)]
                ${index === 0 ? 'md:mb-8' : ''} /* Pushes first icon away from the rest on desktop */
                md:justify-start md:overflow-hidden md:w-full
              `}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Icon size={24} strokeWidth={2.25} className="shrink-0" />

              <span
                ref={(el) => { labelRefs.current[index] = el; }}
                className={`
                hidden md:block whitespace-nowrap overflow-hidden opacity-0 max-w-0 ml-0
              `}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom Icons Container */}
      <div className="hidden md:flex flex-col gap-6 mt-auto items-center md:items-start w-full md:px-[25px]">

        {/* Theme Toggle Button */}
        {showThemeToggle && mounted && (
          <div
            ref={(el) => { iconRefs.current[navItems.length] = el; }}
            onClick={handleThemeToggle}
            title="Toggle Theme"
            className="cursor-pointer p-2 rounded-xl hover:bg-[var(--sb-hover-light)] dark:hover:bg-[var(--sb-hover-dark)] transition-colors duration-300 flex items-center md:justify-start md:overflow-hidden md:w-full"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div
              ref={themeIconRef}
              className="shrink-0 transition-transform duration-300"
              style={{ transform: `rotate(${theme === 'dark' ? 0 : 35}deg)` }}
            >
              {theme === 'dark' ? (
                <Sun size={24} strokeWidth={2.25} />
              ) : (
                <Moon size={24} strokeWidth={2.25} />
              )}
            </div>
            <span
              ref={(el) => { labelRefs.current[navItems.length] = el; }}
              className={`
              hidden md:block whitespace-nowrap overflow-hidden opacity-0 max-w-0 ml-0
            `}
            >
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </div>
        )}

        {/* Help Icon */}
        {showHelpIcon && (
          <div
            ref={(el) => { iconRefs.current[navItems.length + (showThemeToggle ? 1 : 0)] = el; }}
            onClick={onHelpClick}
            title="Help & Support"
            className="cursor-pointer p-2 rounded-xl hover:bg-[var(--sb-hover-light)] dark:hover:bg-[var(--sb-hover-dark)] transition-colors duration-300 flex items-center md:justify-start md:overflow-hidden md:w-full"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <HelpIcon size={24} strokeWidth={2.25} className="shrink-0" />
            <span
              ref={(el) => { labelRefs.current[navItems.length + (showThemeToggle ? 1 : 0)] = el; }}
              className={`
              hidden md:block whitespace-nowrap overflow-hidden opacity-0 max-w-0 ml-0
            `}
            >
              Help & Support
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
