"use client";

import { motion, useScroll, useSpring, useMotionValueEvent, useReducedMotion } from "framer-motion";
import { useRef } from "react";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Track the scroll progress of the entire 300vh section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Smooth the scroll progress for a cinematic scrubbing feel.
  // The spring physics naturally use requestAnimationFrame and settle exactly at the target.
  const smoothProgress = useSpring(scrollYProgress, { 
    stiffness: 100, 
    damping: 30, 
    restDelta: 0.001 
  });

  // Update video currentTime based on the smoothed scroll progress
  useMotionValueEvent(smoothProgress, "change", (latest) => {
    if (shouldReduceMotion) return; // Respect prefers-reduced-motion

    const video = videoRef.current;
    if (video && Number.isFinite(video.duration) && video.duration > 0) {
      video.currentTime = latest * video.duration;
    }
  });

  return (
    <section
      ref={sectionRef}
      className="relative h-[300vh] bg-brand-black"
    >
      {/* Sticky Container keeps the hero visual pinned while the user scrolls through the 300vh section */}
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden flex items-center">
        {/* Video Background */}
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
          preload="metadata"
        >
          <source src="/videos/video.mp4" type="video/mp4" />
        </video>

        {/* Subtle Overlay for text readability */}
        <div className="absolute inset-0 bg-black/20 pointer-events-none z-0" />

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-24 flex flex-col justify-center h-full pointer-events-none">
          <div className="max-w-xl pointer-events-auto">
            <motion.p
              className="font-mono text-xs md:text-sm uppercase tracking-[0.3em] text-brand-gray-400 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              Premium Footwear
            </motion.p>
            
            <motion.h1
              className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              Comfort in <br/>
              every step.
            </motion.h1>
            
            <motion.p
              className="text-brand-gray-300 mb-12 max-w-md text-sm md:text-base leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              Premium footwear designed for everyday confidence. 
              Experience the perfect blend of modern aesthetics and unparalleled comfort.
            </motion.p>
            
            <motion.div
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
            >
              <a
                href="/men"
                className="inline-block border border-white/30 px-8 py-3 font-mono text-xs uppercase tracking-widest text-white hover:bg-white hover:text-brand-black transition-colors duration-500"
              >
                Shop Men
              </a>
              <a
                href="/women"
                className="inline-block border border-white/30 px-8 py-3 font-mono text-xs uppercase tracking-widest text-white hover:bg-white hover:text-brand-black transition-colors duration-500"
              >
                Shop Women
              </a>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-6 md:left-12 lg:left-24 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-white/50 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
