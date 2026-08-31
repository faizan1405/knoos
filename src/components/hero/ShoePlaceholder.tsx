"use client";

import { useRef } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";

export function ShoePlaceholder() {
  const meshRef = useRef<THREE.Group>(null);

  return (
    <group ref={meshRef}>
      {/* A stylized shoe-like geometry placeholder */}
      <mesh position={[0, -0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 0.4, 2.2]} />
        <meshStandardMaterial color="#222222" roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.5, 0.5]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.8, 1.2]} />
        <meshStandardMaterial color="#333333" roughness={0.7} metalness={0.2} />
      </mesh>
      
      {/* Warning Text */}
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.15}
        color="#ff4444"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        PLACEHOLDER
      </Text>
      <Text
        position={[0, 1.2, 0]}
        fontSize={0.1}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        REPLACE WITH FINAL APPROVED MODEL
      </Text>
    </group>
  );
}
