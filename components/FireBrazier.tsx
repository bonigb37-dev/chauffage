'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

interface FireBrazierProps {
  /**
   * 'dark' for dark or terracotta backgrounds (Contact, FAQ, Guide Pellets)
   * 'light' for light backgrounds (Home Hero, Products, About, Services)
   */
  variant?: 'light' | 'dark';
  /**
   * Density / intensity of the brazier
   */
  intensity?: 'high' | 'medium' | 'subtle';
  className?: string;
}

export default function FireBrazier({
  variant = 'dark',
  className = '',
}: FireBrazierProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    video.muted = true;
    video.defaultMuted = true;

    const playVideo = () => {
      video.play().catch(() => {
        // Autoplay fallback
      });
    };
    playVideo();

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        void video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
    observer.observe(container);

    const handleVisibility = () => {
      if (document.hidden) {
        video.pause();
      } else {
        void video.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`brazier-container pointer-events-none absolute inset-0 -z-0 overflow-hidden ${className}`}
    >
      {/* 1. Real Burning Wood Logs background image */}
      <Image
        src="/BD.jpg"
        alt=""
        fill
        sizes="100vw"
        priority
        className={`object-cover object-bottom transition-opacity duration-700 ${
          variant === 'dark' ? 'opacity-55' : 'opacity-40'
        }`}
      />

      {/* 2. Living Flames Video Loop with mix-blend-screen so black background is 100% transparent */}
      <video
        ref={videoRef}
        src="/hero-fire-loop-20261013.mp4"
        poster="/BD.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
        disablePictureInPicture
        disableRemotePlayback
        className={`absolute inset-0 h-full w-full object-cover object-bottom mix-blend-screen pointer-events-none ${
          variant === 'dark' ? 'opacity-70' : 'opacity-60'
        }`}
      />

      {/* 3. Gradient Vignette ensuring text legibility on the left while keeping wood logs sharp */}
      <div
        className={`absolute inset-0 ${
          variant === 'dark'
            ? 'bg-gradient-to-r from-[#A33D1E]/85 via-[#A33D1E]/60 to-[#A33D1E]/20'
            : 'bg-gradient-to-r from-[#FDFBF7]/90 via-[#FDFBF7]/70 to-[#FDFBF7]/30'
        }`}
      />

      {/* 4. CSS Ambient Heat & Ember Atmosphere */}
      <div
        className={`brazier-atmosphere absolute inset-0 ${
          variant === 'dark' ? 'brazier-atmosphere--dark' : 'brazier-atmosphere--light'
        }`}
      />

      {/* 5. Floating Glowing Embers */}
      <div className="absolute inset-x-0 bottom-4 h-48 pointer-events-none overflow-hidden">
        <span className="absolute bottom-6 right-1/4 h-2 w-2 rounded-full bg-amber-400 blur-[1px] animate-ember-1" />
        <span className="absolute bottom-10 right-1/3 h-2.5 w-2.5 rounded-full bg-orange-400 blur-[1px] animate-ember-2" />
        <span className="absolute bottom-4 right-1/5 h-1.5 w-1.5 rounded-full bg-yellow-300 blur-[0.5px] animate-ember-3" />
        <span className="absolute bottom-8 right-2/5 h-2 w-2 rounded-full bg-orange-500 blur-[1px] animate-ember-1" />
      </div>

      {/* 6. Bottom Brazier Hearth Glowing Edge */}
      <div
        className={`absolute inset-x-0 bottom-0 h-20 sm:h-28 z-10 ${
          variant === 'dark'
            ? 'bg-gradient-to-t from-[#A33D1E]/60 via-[#FF6D00]/25 to-transparent'
            : 'bg-gradient-to-t from-[#A33D1E]/30 via-[#FF9500]/15 to-transparent'
        }`}
      />
    </div>
  );
}
