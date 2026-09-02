"use client";

import { motion, useReducedMotion } from "framer-motion";
import { easings } from "./constants";
import React from "react";

interface RevealTextProps {
  text: string;
  className?: string;
  delay?: number;
  as?: React.ElementType;
}

export function RevealText({ text, className = "", delay = 0, as = "span" }: RevealTextProps) {
  const shouldReduceMotion = useReducedMotion();
  const Component = as as any;
  
  // Split text by lines if it contains newlines, or treat as single line
  const lines = text.split("\n");

  if (shouldReduceMotion) {
    return (
      <Component className={className}>
        {lines.map((line: string, i: number) => (
          <React.Fragment key={i}>
            {line}
            {i < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </Component>
    );
  }

  // The outer component uses the 'as' tag (e.g., h2, p).
  // The inner animated component MUST be a span to ensure valid HTML nesting.
  const MotionComponent = motion.span;

  return (
    <Component className={`${className} flex flex-col`}>
      {lines.map((line: string, i: number) => (
        <span key={i} className="overflow-hidden inline-block align-bottom">
          <MotionComponent
            className="inline-block whitespace-pre-wrap"
            initial={{ y: "100%", opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 0.8,
              delay: delay + i * 0.08,
              ease: easings.premium,
            }}
          >
            {line}
          </MotionComponent>
        </span>
      ))}
    </Component>
  );
}
