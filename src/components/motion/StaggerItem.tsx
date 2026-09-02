"use client";

import { motion, useReducedMotion, HTMLMotionProps } from "framer-motion";
import { easings } from "./constants";

interface StaggerItemProps extends HTMLMotionProps<"div"> {
  yOffset?: number;
}

export function StaggerItem({
  children,
  yOffset = 30,
  ...props
}: StaggerItemProps) {
  const shouldReduceMotion = useReducedMotion();

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: shouldReduceMotion ? 0 : yOffset 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.1 : 0.8,
        ease: easings.premium,
      }
    },
  };

  return (
    <motion.div variants={itemVariants} {...props}>
      {children}
    </motion.div>
  );
}
