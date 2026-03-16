"use client";

import Header from "../../components/header";
import { Footer } from "../../components/footer";
import Scene from "../../components/Scene";

export default function Page() {
  return (
    <main className="min-h-screen relative flex flex-col bg-[#111a28] text-[#d2ad82] overflow-hidden font-serif">
      {/* 3D Scene Background */}
      <Scene />

      {/* Grid Lines */}
      <div className="absolute inset-0 z-0 pointer-events-none flex justify-evenly opacity-10">
        <div className="w-[1px] h-full bg-white"></div>
        <div className="w-[1px] h-full bg-white"></div>
        <div className="w-[1px] h-full bg-white"></div>
        <div className="w-[1px] h-full bg-white"></div>
      </div>

      <Header
        themeColors={{
          light: { bgInitial: "transparent", bgScrolled: "#111a28", textInitial: "#d2ad82", textScrolled: "#d2ad82" },
          dark: { bgInitial: "transparent", bgScrolled: "#111a28", textInitial: "#d2ad82", textScrolled: "#d2ad82" }
        }}
      />

      <section className="relative z-10 min-h-[100vh] flex flex-col justify-center pt-32 pb-20 px-12 md:px-24 pointer-events-none">
        <div className="max-w-xl space-y-16">

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-medium tracking-wide">
              Justitia: The Allegory of Justice
            </h1>
            <p className="text-sm md:text-base text-[#a2a2a2] font-sans leading-relaxed max-w-md">
              Lorem Ipsum is simply dummy text of the printing and typesetting industry.
              Lorem Ipsum has been the industry's standard dummy text ever since the
              1500s, when an unknown printer took a galley of type and scrambled it to
              make a type specimen book.
            </p>
          </div>

          <div className="space-y-4 relative">
            {/* Cursor icon from mockup (just for decoration) */}
            <div className="absolute -right-8 top-0 w-6 h-6 border-l-2 border-t-2 border-[#d2ad82] rotate-45 transform origin-bottom-right"></div>
            <h2 className="text-3xl md:text-4xl font-medium tracking-wide">
              Full-scale Statue
            </h2>
            <p className="text-sm md:text-base text-[#a2a2a2] font-sans leading-relaxed max-w-md">
              Lorem Ipsum is simply dummy text of the printing and typesetting industry.
              Lorem Ipsum has been the industry's standard dummy text ever since the
              1500s, when an unknown printer took a galley of type and scrambled it to
              make a type specimen book.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-medium tracking-wide">
              Ancient Roman Tradition
            </h2>
            <p className="text-sm md:text-base text-[#a2a2a2] font-sans leading-relaxed max-w-md">
              Lorem Ipsum is simply dummy text of the printing and typesetting industry.
              Lorem Ipsum has been the industry's standard dummy text ever since the
              1500s, when an unknown printer took a galley of type and scrambled it to
              make a type specimen book.
            </p>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
