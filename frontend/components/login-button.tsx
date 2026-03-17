import React from "react";
import Link from "next/link";

interface LoginButtonProps {
  hoverTextColor?: string;
}

export default function LoginButton({
  hoverTextColor = "#F5F0E8",
}: LoginButtonProps) {
  return (
    <div className="scale-75 md:scale-90 origin-right">
      <Link
        href="/login"
        className="group relative box-border inline-flex items-center justify-center cursor-pointer font-bold tracking-[0.05em] text-[13px] px-[2em] py-[1.25em] m-0 outline-none overflow-visible text-center decoration-none normal-case select-none transition-all duration-300"
        style={
          {
            "--hover-text": hoverTextColor,
          } as React.CSSProperties
        }
      >
        {/* Background Filler */}
        <span className="absolute inset-0 bg-current opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />

        {/* Left Line */}
        <span className="absolute left-[1.5em] top-1/2 h-[2px] w-[1.5625rem] -translate-y-1/2 bg-current transition-all duration-300 origin-center group-hover:w-[0.9375rem] group-hover:bg-[var(--hover-text)] z-10" />

        {/* Text */}
        <span className="relative z-10 block pl-[2em] text-[1.125em] leading-[1.33333em] text-left uppercase transition-all duration-300 group-hover:pl-[1.5em] group-hover:text-[var(--hover-text)]">
          Login
        </span>

        {/* Borders */}
        <span className="absolute top-0 left-0 h-full w-[2px] bg-current transition-colors duration-300" />
        <span className="absolute top-0 right-0 h-full w-[2px] bg-current transition-colors duration-300" />

        <span
          className="absolute top-0 left-0 h-[2px] bg-current transition-all duration-500 ease-out group-hover:w-0"
          style={{ width: "0.625rem" }}
        />
        <span
          className="absolute top-0 right-0 h-[2px] bg-current transition-all duration-500 ease-out group-hover:w-full"
          style={{ width: "calc(100% - 2.1875rem)" }}
        />

        <span
          className="absolute bottom-0 left-0 h-[2px] bg-current transition-all duration-500 ease-out group-hover:w-full"
          style={{ width: "calc(100% - 3.4375rem)" }}
        />
        <span
          className="absolute bottom-0 right-[1.25rem] h-[2px] bg-current transition-all duration-500 ease-out group-hover:right-0 group-hover:w-0"
          style={{ width: "0.625rem" }}
        />
        <span
          className="absolute bottom-0 right-0 h-[2px] w-[0.625rem] bg-current transition-all duration-500 ease-out group-hover:w-0"
        />
      </Link>
    </div>
  );
}
