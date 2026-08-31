"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ShoePlaceholder } from "./ShoePlaceholder";
import { Environment, ContactShadows } from "@react-three/drei";

export function HeroScene({ isMobile }: { isMobile: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Track raw scroll progress
  const scrollProgress = useRef(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check reduced motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    
    const listener = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener("change", listener);
    
    const handleScroll = () => {
      if (mediaQuery.matches) return; // Skip updating scroll if reduced motion
      const scrollY = window.scrollY;
      const maxScroll = window.innerHeight; // animate across the first viewport
      const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
      scrollProgress.current = progress;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      mediaQuery.removeEventListener("change", listener);
    };
  }, []);

  const smoothProgress = useRef(0);

  // Position offset based on screen size
  // On desktop, move it to the right so it doesn't overlap text
  const baseX = isMobile ? 0 : 1.5;
  const baseY = isMobile ? -0.5 : 0;

  useFrame((state, delta) => {
    if (prefersReducedMotion) return; // Static when reduced motion

    smoothProgress.current = THREE.MathUtils.damp(
      smoothProgress.current,
      scrollProgress.current,
      4,
      delta
    );

    if (groupRef.current) {
      const p = smoothProgress.current;
      
      // Base rotation (slightly angled towards camera)
      const baseRotX = 0.2;
      const baseRotY = -Math.PI / 4;
      
      // Target rotation (rotates down and sideways as we scroll)
      const targetRotX = baseRotX + p * 0.5;
      const targetRotY = baseRotY + p * Math.PI;
      
      // Target position
      // Add subtle floating effect when scroll is 0
      const floatY = p < 0.1 ? Math.sin(state.clock.elapsedTime) * 0.05 * (1 - p / 0.1) : 0;
      
      // As we scroll, the shoe moves up and away
      const targetY = baseY + (p * -1.5) + floatY;
      const targetZ = p * -3; 
      
      // Also can shift X slightly during scroll
      const targetX = baseX + (p * 0.5);

      groupRef.current.rotation.x = targetRotX;
      groupRef.current.rotation.y = targetRotY;
      
      groupRef.current.position.x = targetX;
      groupRef.current.position.y = targetY;
      groupRef.current.position.z = targetZ;
    }
  });

  return (
    <>
      <Environment preset="city" />
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={1.5} 
        castShadow={!isMobile} 
        shadow-mapSize={[1024, 1024]} 
      />
      <spotLight position={[-5, 5, -5]} intensity={0.5} color="#ffffff" />
      
      <group ref={groupRef} position={[baseX, baseY, 0]} rotation={[0.2, -Math.PI / 4, 0]}>
        <ShoePlaceholder />
      </group>

      <ContactShadows 
        position={[baseX, baseY - 1.5, 0]} 
        opacity={0.5} 
        scale={10} 
        blur={2} 
        far={4} 
        color="#000000"
      />
    </>
  );
}
