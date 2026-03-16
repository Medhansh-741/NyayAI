"use client";

import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, Float } from '@react-three/drei';
import { Model } from './Ladyjustice';
import { Suspense } from 'react';

export default function Scene() {
  return (
    <div className="w-full h-full absolute inset-0 z-0 pointer-events-none">
      <Canvas
        shadows
        camera={{ position: [0, 0, 14], fov: 45 }}
        className="pointer-events-auto"
      >
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

        <Suspense fallback={null}>
          <group rotation={[0, 5, 0]}>
            <Float rotationIntensity={0.05} floatIntensity={0.1} speed={1.5}>
              {/* Positioned on the right half of screen, matching mockup */}
              <Model position={[6, -1, 0]} scale={0.65} />
            </Float>
          </group>
          <ContactShadows
            position={[3.5, -7.0, 0]}
            opacity={0.4}
            scale={12}
            blur={2.5}
            far={4}
          />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}
