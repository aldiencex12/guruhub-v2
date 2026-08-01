"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Detect if this is the first page load in the session to avoid annoying splash screen on every page reload
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
    if (hasSeenSplash) {
      setVisible(false);
      return;
    }

    const timer1 = setTimeout(() => {
      setFadeOut(true);
    }, 1500); // start fade out after 1.5 seconds

    const timer2 = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("hasSeenSplash", "true");
    }, 1800); // completely hide after 1.8 seconds

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center transition-opacity duration-300 ease-out ${
      fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
    }`}>
      <div className="flex flex-col items-center text-center px-4 animate-in fade-in zoom-in-95 duration-500">
        {/* Soft glow background effect */}
        <div className="absolute h-64 w-64 rounded-full bg-indigo-50/60 blur-[80px]" />

        {/* Logo Container */}
        <div className="relative bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl mb-6 transform hover:scale-105 transition-transform duration-300">
          <img 
            src="/logo-hangtuah.png" 
            alt="Yayasan Hang Tuah" 
            className="h-28 w-28 object-contain filter drop-shadow-[0_4px_12px_rgba(79,70,229,0.08)]"
          />
        </div>
        
        {/* App Title */}
        <h1 className="relative text-3xl font-black tracking-tight text-gray-900">
          GuruHub Mobile
        </h1>
        <p className="text-xs font-bold text-indigo-600/80 mt-1.5 uppercase tracking-wider">
          SMP Hang Tuah 5 Sidoarjo
        </p>

        {/* Custom Progress bar / pulse loader */}
        <div className="mt-8 flex gap-2 justify-center">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
