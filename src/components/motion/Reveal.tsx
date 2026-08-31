"use client";

import { motion, useReducedMotion, HTMLMotionProps } from "framer-motion";
import { easings, durations } from "./constants";

interface RevealProps extends HTMLMotionProps<"div"> {
  delay?: number;
  duration?: number;
  yOffset?: number;
}

export function Reveal({ 
  children, 
  delay = 0, 
  duration = durations.normal, 
  yOffset = 24,
  ...props 
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: shouldReduceMotion ? 0.1 : duration, 
        delay: shouldReduceMotion ? 0 : delay, 
        ease: easings.premium 
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

