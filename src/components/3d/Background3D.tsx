import { Canvas } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Partículas flotantes interactivas
const FloatingParticles = () => {
  const particles = useRef<THREE.Points>(null!);
  const particleCount = 100;

  const [geoData, setGeoData] = useState<{positions: Float32Array, colors: Float32Array} | null>(null);

  useEffect(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 50;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 20;

        // Colores amarillo/ámbar
        const yellowVariant = Math.random();
        col[i * 3] = 1; // R
        col[i * 3 + 1] = yellowVariant * 0.9 + 0.1; // G (amarillo a ámbar)
        col[i * 3 + 2] = 0; // B
    }
    setGeoData({ positions: pos, colors: col });
  }, []);

  useFrame((state) => {
    if (particles.current) {
      particles.current.rotation.y = state.clock.elapsedTime * 0.05;
      particles.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.02) * 0.1;
    }
  });

  if (!geoData) return null;

  return (
    <points ref={particles}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[geoData.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[geoData.colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Formas geométricas flotantes
const FloatingShapes = () => {
  return (
    <>
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[-8, 5, -5]}>
          <torusGeometry args={[1, 0.3, 16, 32]} />
          <meshStandardMaterial
            color="#ffe600"
            emissive="#ffe600"
            emissiveIntensity={0.3}
            transparent
            opacity={0.1}
            wireframe
          />
        </mesh>
      </Float>

      <Float speed={2} rotationIntensity={0.3} floatIntensity={0.8}>
        <mesh position={[10, -3, -8]}>
          <octahedronGeometry args={[1.5]} />
          <meshStandardMaterial
            color="#ffaa00"
            emissive="#ffaa00"
            emissiveIntensity={0.2}
            transparent
            opacity={0.08}
            wireframe
          />
        </mesh>
      </Float>

      <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.6}>
        <mesh position={[0, 8, -10]}>
          <icosahedronGeometry args={[0.8]} />
          <meshStandardMaterial
            color="#ffe600"
            emissive="#ffe600"
            emissiveIntensity={0.25}
            transparent
            opacity={0.12}
            wireframe
          />
        </mesh>
      </Float>
    </>
  );
};

export const Background3D = () => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.2} />
        
        {/* Campo de estrellas */}
        <Stars
          radius={100}
          depth={50}
          count={3000}
          factor={4}
          saturation={0.5}
          fade
          speed={0.5}
        />

        {/* Partículas flotantes */}
        <FloatingParticles />

        {/* Formas geométricas */}
        <FloatingShapes />
      </Canvas>
    </div>
  );
};
