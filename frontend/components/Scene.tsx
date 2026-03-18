"use client";

import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, Float, useGLTF } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';

// ── Auto-rotating model loader ──────────────────────────────────────────────
// Drop your .glb file in /public and update MODEL_PATH below
const MODEL_PATH = '/ladyjustice-transformed.glb';

function RotatingModel(props: React.ComponentProps<'group'>) {
  const group = useRef<THREE.Group>(null!);
  const { scene } = useGLTF(MODEL_PATH);

  // Clone so the original scene graph isn't mutated
  const cloned = scene.clone(true);

  // Enable shadows on every mesh inside the loaded model
  cloned.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      (child as THREE.Mesh).castShadow = true;
      (child as THREE.Mesh).receiveShadow = true;
    }
  });

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y -= delta * 0.15; // faster, reversed
    }
  });

  return (
    <group ref={group} {...props}>
      <primitive object={cloned} />
    </group>
  );
}

useGLTF.preload(MODEL_PATH);

// ── Fallback shown while model loads ────────────────────────────────────────
function LoadingCube() {
  const mesh = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    if (mesh.current) mesh.current.rotation.y += delta * 0.6;
  });
  return (
    <mesh ref={mesh} position={[6, -1, 0]} scale={0.8}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color="#d2ad82" wireframe />
    </mesh>
  );
}

// ── Scene ────────────────────────────────────────────────────────────────────
export default function Scene() {
  return (
    <div className="w-full h-full absolute inset-0 z-0 pointer-events-none">
      <Canvas
        shadows
        gl={{ alpha: true, antialias: true }}       // transparent canvas
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);             // fully transparent bg
        }}
        camera={{ position: [0, 0, 14], fov: 45 }}
        className="pointer-events-auto"
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          intensity={1}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-5, 5, -5]} intensity={0.3} />

        <Suspense fallback={<LoadingCube />}>
          {/*
            Float adds a gentle bobbing motion on top of the Y-axis rotation.
            Remove <Float> if you want pure rotation only.
          */}
          <Float
            floatIntensity={0.15}
            rotationIntensity={0}   // rotation handled by useFrame, not Float
            speed={1.5}
          >
            <RotatingModel
              position={[3.5, -3.8, 0]}
              scale={1.3}
              rotation={[0, 5, 0]}
            />
          </Float>

          <ContactShadows
            position={[4.5, -6.5, 0]}
            opacity={0.35}
            scale={10}
            blur={2.5}
            far={4}
          />
          <Environment files="/potsdamer_platz_1k.hdr" />
        </Suspense>
      </Canvas>
    </div>
  );
}