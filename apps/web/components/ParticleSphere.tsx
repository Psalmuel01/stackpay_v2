"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useMemo, useRef } from "react";

function SpherePoints() {
  const ref = useRef<THREE.Points>(null!);
  const count = 1500;
  const positions = useMemo(() => {
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 1.05 + Math.random() * 0.06;
      data[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      data[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      data[i * 3 + 2] = r * Math.cos(phi);
    }
    return data;
  }, []);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += (Math.PI * 2 * delta) / 30;
      ref.current.rotation.x += (Math.PI * 2 * delta) / 90;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled>
      <PointMaterial
        transparent
        color="#e5e5e5"
        size={0.02}
        sizeAttenuation
        depthWrite={false}
        opacity={0.85}
      />
    </Points>
  );
}

export default function ParticleSphere() {
  return (
    <div className="pointer-events-none absolute right-[-2%] top-[-4%] h-[480px] w-[480px] opacity-80 md:h-[600px] md:w-[600px]">
      <Canvas camera={{ position: [0, 0, 3.1], fov: 50 }} dpr={[1, 2]}>
        <ambientLight intensity={0.6} />
        <SpherePoints />
      </Canvas>
    </div>
  );
}
