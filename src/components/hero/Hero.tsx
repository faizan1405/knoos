"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen flex items-center justify-center overflow-hidden bg-brand-black"
    >
      <motion.div className="absolute inset-0" style={{ y, scale }}>
        <div className="w-full h-full bg-gradient-to-b from-brand-gray-900 via-brand-black to-brand-black" />
      </motion.div>

      <motion.div
        className="relative z-10 text-center px-6"
        style={{ opacity }}
      >
        <motion.h1
          className="font-serif text-6xl md:text-8xl lg:text-9xl text-white mb-6 leading-none"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          KNOOS
        </motion.h1>
        <motion.p
          className="font-mono text-xs md:text-sm uppercase tracking-[0.3em] text-brand-gray-400"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          Premium Footwear
        </motion.p>
        <motion.div
          className="mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          <a
            href="/men"
            className="inline-block border border-white/30 px-8 py-3 font-mono text-xs uppercase tracking-widest text-white hover:bg-white hover:text-brand-black transition-colors duration-500"
          >
            Explore Collection
          </a>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/30 to-transparent" />
      </motion.div>
    </section>
  );
}
