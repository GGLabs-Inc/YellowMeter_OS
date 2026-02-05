import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StarProps {
  count?: number;
  speed?: number;
  depth?: number;
  color?: string;
}

const HyperspeedStars = ({ count = 5000, speed = 1, depth = 100, color = '#ffe600' }: StarProps) => {
  const points = useRef<THREE.Points>(null!);

  // Generar posiciones y velocidades aleatorias
  const [positions, velocities] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Posición inicial aleatoria en un cilindro
      const radius = Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      
      positions[i3] = Math.cos(theta) * radius; // x
      positions[i3 + 1] = Math.sin(theta) * radius; // y
      positions[i3 + 2] = (Math.random() - 0.5) * depth; // z
      
      // Velocidad aleatoria
      velocities[i] = Math.random() * 0.5 + 0.5;
    }

    return [positions, velocities];
  }, [count, depth]);

  useFrame((_state, delta) => {
    if (!points.current) return;

    const positions = points.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Mover hacia adelante (aumentar Z)
      positions[i3 + 2] += velocities[i] * speed * delta * 60;

      // Reset cuando sale del campo de visión
      if (positions[i3 + 2] > depth / 2) {
        positions[i3 + 2] = -depth / 2;
        
        // Nueva posición aleatoria en X, Y
        const radius = Math.random() * 20;
        const theta = Math.random() * Math.PI * 2;
        positions[i3] = Math.cos(theta) * radius;
        positions[i3 + 1] = Math.sin(theta) * radius;
      }
    }

    points.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color={color}
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Componente de líneas de velocidad (trails)
const SpeedLines = ({ count = 100, speed = 2, color = '#ffe600' }: StarProps) => {
  const linesRef = useRef<THREE.LineSegments>(null!);

  const [positions, velocities] = useMemo(() => {
    const positions = new Float32Array(count * 6); // 2 puntos por línea (inicio y fin)
    const velocities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i6 = i * 6;
      const radius = Math.random() * 15 + 5;
      const theta = Math.random() * Math.PI * 2;
      const x = Math.cos(theta) * radius;
      const y = Math.sin(theta) * radius;
      const z = (Math.random() - 0.5) * 100;

      // Punto inicial
      positions[i6] = x;
      positions[i6 + 1] = y;
      positions[i6 + 2] = z;

      // Punto final (más atrás para crear la línea)
      positions[i6 + 3] = x;
      positions[i6 + 4] = y;
      positions[i6 + 5] = z - Math.random() * 2 - 1;

      velocities[i] = Math.random() * 0.8 + 0.4;
    }

    return [positions, velocities];
  }, [count]);

  useFrame((_state, delta) => {
    if (!linesRef.current) return;

    const positions = linesRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i6 = i * 6;
      const moveSpeed = velocities[i] * speed * delta * 60;

      // Mover ambos puntos de la línea
      positions[i6 + 2] += moveSpeed;
      positions[i6 + 5] += moveSpeed;

      // Reset cuando sale del campo de visión
      if (positions[i6 + 2] > 50) {
        const radius = Math.random() * 15 + 5;
        const theta = Math.random() * Math.PI * 2;
        const x = Math.cos(theta) * radius;
        const y = Math.sin(theta) * radius;

        positions[i6] = x;
        positions[i6 + 1] = y;
        positions[i6 + 2] = -50;
        positions[i6 + 3] = x;
        positions[i6 + 4] = y;
        positions[i6 + 5] = positions[i6 + 2] - Math.random() * 2 - 1;
      }
    }

    linesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
};

interface HyperspeedBackgroundProps {
  starCount?: number;
  lineCount?: number;
  speed?: number;
  color?: string;
}

export const HyperspeedBackground = ({
  starCount = 5000,
  lineCount = 100,
  speed = 1,
  color = '#ffe600'
}: HyperspeedBackgroundProps) => {
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
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ alpha: true, antialias: false }} // antialias off para mejor performance
        style={{ background: 'transparent' }}
      >
        <HyperspeedStars count={starCount} speed={speed} color={color} />
        <SpeedLines count={lineCount} speed={speed * 1.5} color={color} />
      </Canvas>
    </div>
  );
};
