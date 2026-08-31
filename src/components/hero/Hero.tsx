"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { HeroCanvas } from "./HeroCanvas";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative h-[90vh] md:h-[100vh] min-h-[600px] flex items-center overflow-hidden bg-brand-black"
    >
      {/* 3D Canvas Background */}
      <HeroCanvas />

      {/* Gradient Overlay for text readability on smaller screens if needed */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-black/80 via-brand-black/20 to-transparent pointer-events-none z-0" />

      {/* Content */}
      <motion.div
        className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-24 flex flex-col justify-center h-full pointer-events-none"
        style={{ opacity, y }}
      >
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
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-6 md:left-12 lg:left-24 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <div className="w-px h-16 bg-gradient-to-b from-transparent via-white/50 to-transparent" />
      </motion.div>
    </section>
  );
}
