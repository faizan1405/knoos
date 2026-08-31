"use client";

import { motion, useReducedMotion, HTMLMotionProps } from "framer-motion";
import { easings, durations } from "./constants";

interface FadeInProps extends HTMLMotionProps<"div"> {
  delay?: number;
  duration?: number;
}

export function FadeIn({ children, delay = 0, duration = durations.normal, ...props }: FadeInProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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

