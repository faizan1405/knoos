"use client";

import { Canvas } from "@react-three/fiber";
import React, { Suspense, useEffect, useState, Component, ErrorInfo, ReactNode } from "react";
import { HeroScene } from "./HeroScene";
import { Html, useProgress } from "@react-three/drei";

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center space-y-4">
        <span className="font-serif text-xl tracking-widest text-white/50">KNOOS</span>
        <div className="w-24 h-[1px] bg-white/10 overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Html>
  );
}

function Fallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-brand-black">
      {/* 
        This is a fallback placeholder. 
        In production, replace this with a real optimized product image.
      */}
      <div className="text-brand-gray-400 font-mono text-sm uppercase tracking-widest">
        KNOOS Premium Footwear
      </div>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("WebGL Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function HeroCanvas() {
  const [dpr, setDpr] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setDpr(mobile ? 1 : Math.min(window.devicePixelRatio, 2));
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <ErrorBoundary fallback={<Fallback />}>
        <Canvas
          shadows={!isMobile}
          dpr={dpr}
          camera={{ position: [0, 0, 5], fov: 45 }}
          gl={{ antialias: !isMobile, powerPreference: "high-performance", alpha: true }}
        >
          <Suspense fallback={<Loader />}>
            <HeroScene isMobile={isMobile} />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}
