"use client";

import { motion, useScroll, useSpring, useMotionValueEvent, useReducedMotion, useTransform } from "framer-motion";
import { useRef } from "react";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Track the scroll progress of the entire 400vh section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Smooth the scroll progress for a cinematic scrubbing feel.
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

  // Message 1: 0% to 25%
  const opacity1 = useTransform(smoothProgress, [0, 0.05, 0.2, 0.25], [1, 1, 1, 0]);
  const y1 = useTransform(smoothProgress, [0, 0.2, 0.25], [0, 0, -30]);

  // Message 2: 25% to 50%
  const opacity2 = useTransform(smoothProgress, [0.2, 0.25, 0.45, 0.5], [0, 1, 1, 0]);
  const y2 = useTransform(smoothProgress, [0.2, 0.25, 0.45, 0.5], [30, 0, 0, -30]);

  // Message 3: 50% to 75%
  const opacity3 = useTransform(smoothProgress, [0.45, 0.5, 0.7, 0.75], [0, 1, 1, 0]);
  const y3 = useTransform(smoothProgress, [0.45, 0.5, 0.7, 0.75], [30, 0, 0, -30]);

  // Message 4: 75% to 100%
  const opacity4 = useTransform(smoothProgress, [0.7, 0.75, 1, 1], [0, 1, 1, 1]);
  const y4 = useTransform(smoothProgress, [0.7, 0.75, 1, 1], [30, 0, 0, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative h-[400vh] bg-brand-black"
    >
      {/* Sticky Container keeps the hero visual pinned while the user scrolls through the 400vh section */}
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden flex flex-col justify-center">
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

        {/* Subtle Overlay for text readability (gradient) */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent pointer-events-none z-0" />
        
        {/* Secondary subtle dark overlay to ensure white text is always readable */}
        <div className="absolute inset-0 bg-black/20 pointer-events-none z-0" />

        {/* Content Layers */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-24 h-full pointer-events-none flex items-center">
          
          {/* Message 1 */}
          <motion.div style={{ opacity: opacity1, y: y1 }} className="absolute max-w-xl pointer-events-auto">
            <p className="font-mono text-xs md:text-sm uppercase tracking-[0.3em] text-brand-gray-300 mb-4 drop-shadow-md">
              KNOOS Original
            </p>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-6 leading-tight drop-shadow-lg">
              Redefining <br/>
              everyday wear.
            </h1>
            <p className="text-white/90 mb-12 max-w-md text-sm md:text-base leading-relaxed drop-shadow-md font-medium">
              We started with a simple idea: comfort should not compromise style. Welcome to the new standard.
            </p>
          </motion.div>

          {/* Message 2 */}
          <motion.div style={{ opacity: opacity2, y: y2 }} className="absolute max-w-xl pointer-events-auto">
            <p className="font-mono text-xs md:text-sm uppercase tracking-[0.3em] text-brand-gray-300 mb-4 drop-shadow-md">
              Craftsmanship
            </p>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-6 leading-tight drop-shadow-lg">
              Materials <br/>
              that matter.
            </h1>
            <p className="text-white/90 mb-12 max-w-md text-sm md:text-base leading-relaxed drop-shadow-md font-medium">
              Sourced globally, assembled with precision. Our premium leather and responsive soles work together seamlessly.
            </p>
          </motion.div>

          {/* Message 3 */}
          <motion.div style={{ opacity: opacity3, y: y3 }} className="absolute max-w-xl pointer-events-auto">
            <p className="font-mono text-xs md:text-sm uppercase tracking-[0.3em] text-brand-gray-300 mb-4 drop-shadow-md">
              Movement
            </p>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-6 leading-tight drop-shadow-lg">
              Engineered <br/>
              for motion.
            </h1>
            <p className="text-white/90 mb-12 max-w-md text-sm md:text-base leading-relaxed drop-shadow-md font-medium">
              Whether commuting through the city or standing all day, experience dynamic support that adapts to you.
            </p>
          </motion.div>

          {/* Message 4 & CTA */}
          <motion.div style={{ opacity: opacity4, y: y4 }} className="absolute max-w-xl pointer-events-auto">
            <p className="font-mono text-xs md:text-sm uppercase tracking-[0.3em] text-brand-gray-300 mb-4 drop-shadow-md">
              Collection
            </p>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-6 leading-tight drop-shadow-lg">
              Find your <br/>
              perfect fit.
            </h1>
            <p className="text-white/90 mb-10 max-w-md text-sm md:text-base leading-relaxed drop-shadow-md font-medium">
              Explore the latest arrivals. Comfort and elegance, now available for men and women.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="/men"
                className="inline-block border border-white/40 bg-black/20 backdrop-blur-sm px-8 py-3 font-mono text-xs uppercase tracking-widest text-white hover:bg-white hover:text-brand-black transition-colors duration-500"
              >
                Shop Men
              </a>
              <a
                href="/women"
                className="inline-block border border-white/40 bg-black/20 backdrop-blur-sm px-8 py-3 font-mono text-xs uppercase tracking-widest text-white hover:bg-white hover:text-brand-black transition-colors duration-500"
              >
                Shop Women
              </a>
            </div>
          </motion.div>
          
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-6 md:left-12 lg:left-24 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/50" style={{ writingMode: 'vertical-rl' }}>Scroll</span>
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-white/50 to-transparent" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
