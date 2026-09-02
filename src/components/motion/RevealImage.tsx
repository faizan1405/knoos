"use client";

import { motion, useReducedMotion, HTMLMotionProps } from "framer-motion";
import { easings } from "./constants";

interface RevealImageProps extends HTMLMotionProps<"div"> {
  delay?: number;
  scaleFrom?: number;
}

export function RevealImage({
  children,
  delay = 0,
  scaleFrom = 1.04,
  ...props
}: RevealImageProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        scale: shouldReduceMotion ? 1 : scaleFrom 
      }}
      whileInView={{ 
        opacity: 1, 
        scale: 1 
      }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: shouldReduceMotion ? 0.1 : 0.8, 
        delay: shouldReduceMotion ? 0 : delay, 
        ease: easings.premium 
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
