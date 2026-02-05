import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PixelBlastProps {
  pixelCount?: number;
  speed?: number;
  explosionRadius?: number;
  color?: string;
  backgroundColor?: string;
  scale?: number;
}

interface Pixel {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
}

const PixelBlastEffect = ({
  pixelCount = 1000,
  speed = 1,
  explosionRadius = 20,
  color = '#ffe600',
}: PixelBlastProps) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const pixelsRef = useRef<Pixel[]>([]);
  const timeRef = useRef(0);

  // Inicializar píxeles
  useMemo(() => {
    const pixels: Pixel[] = [];
    const baseColor = new THREE.Color(color);

    for (let i = 0; i < pixelCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      const velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * (0.5 + Math.random() * 0.5),
        Math.sin(phi) * Math.sin(theta) * (0.5 + Math.random() * 0.5),
        Math.cos(phi) * (0.5 + Math.random() * 0.5)
      );

      pixels.push({
        position: new THREE.Vector3(0, 0, 0),
        velocity: velocity,
        life: 0,
        maxLife: 2 + Math.random() * 3,
        size: 0.05 + Math.random() * 0.15,
        color: baseColor.clone().multiplyScalar(0.8 + Math.random() * 0.4),
      });
    }

    pixelsRef.current = pixels;
    return pixels;
  }, [pixelCount, explosionRadius, color]);

  useFrame((_state, delta) => {
    if (!pointsRef.current) return;

    timeRef.current += delta * speed;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const colors = pointsRef.current.geometry.attributes.color.array as Float32Array;
    const sizes = pointsRef.current.geometry.attributes.size.array as Float32Array;

    pixelsRef.current.forEach((pixel, i) => {
      // Actualizar vida del píxel
      pixel.life += delta * speed;

      // Reset cuando muere
      if (pixel.life > pixel.maxLife) {
        pixel.life = 0;
        pixel.position.set(0, 0, 0);
        
        // Nueva dirección aleatoria
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        
        pixel.velocity.set(
          Math.sin(phi) * Math.cos(theta) * (0.5 + Math.random() * 0.5),
          Math.sin(phi) * Math.sin(theta) * (0.5 + Math.random() * 0.5),
          Math.cos(phi) * (0.5 + Math.random() * 0.5)
        );
      }

      // Actualizar posición
      pixel.position.x += pixel.velocity.x * delta * 10 * speed;
      pixel.position.y += pixel.velocity.y * delta * 10 * speed;
      pixel.position.z += pixel.velocity.z * delta * 10 * speed;

      // Aplicar gravedad sutil
      pixel.velocity.y -= delta * 0.5 * speed;

      // Calcular fade out
      const lifeRatio = pixel.life / pixel.maxLife;
      const alpha = 1 - lifeRatio;

      // Actualizar arrays de geometría
      const i3 = i * 3;
      positions[i3] = pixel.position.x;
      positions[i3 + 1] = pixel.position.y;
      positions[i3 + 2] = pixel.position.z;

      colors[i3] = pixel.color.r;
      colors[i3 + 1] = pixel.color.g;
      colors[i3 + 2] = pixel.color.b;

      sizes[i] = pixel.size * alpha;
    });

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;
    pointsRef.current.geometry.attributes.size.needsUpdate = true;
  });

  const [positions, colors, sizes] = useMemo(() => {
    const positions = new Float32Array(pixelCount * 3);
    const colors = new Float32Array(pixelCount * 3);
    const sizes = new Float32Array(pixelCount);

    for (let i = 0; i < pixelCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      const baseColor = new THREE.Color(color);
      colors[i * 3] = baseColor.r;
      colors[i * 3 + 1] = baseColor.g;
      colors[i * 3 + 2] = baseColor.b;

      sizes[i] = 0.1;
    }

    return [positions, colors, sizes];
  }, [pixelCount, color]);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// Múltiples explosiones simultáneas
const MultiBlast = ({ count = 3, color = '#ffe600', speed = 1 }: { count?: number; color?: string; speed?: number }) => {
  const explosions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 15;
      positions.push({
        x: Math.cos(angle) * radius,
        y: (Math.random() - 0.5) * 10,
        z: Math.sin(angle) * radius - 30,
      });
    }
    return positions;
  }, [count]);

  return (
    <>
      {explosions.map((pos, i) => (
        <group key={i} position={[pos.x, pos.y, pos.z]}>
          <PixelBlastEffect 
            pixelCount={300} 
            speed={speed * (0.8 + Math.random() * 0.4)} 
            explosionRadius={8}
            color={color}
          />
        </group>
      ))}
    </>
  );
};

export const PixelBlast = ({
  pixelCount = 1000,
  speed = 1,
  explosionRadius = 20,
  color = '#ffe600',
  backgroundColor = '#000000',
}: PixelBlastProps) => {
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
        camera={{ position: [0, 0, 30], fov: 75 }}
        gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={[backgroundColor]} />
        <fog attach="fog" args={[backgroundColor, 20, 80]} />

        {/* Explosión central principal */}
        <PixelBlastEffect
          pixelCount={pixelCount}
          speed={speed}
          explosionRadius={explosionRadius}
          color={color}
        />

        {/* Explosiones secundarias */}
        <MultiBlast count={4} color={color} speed={speed * 0.7} />

        {/* Luz ambiental sutil */}
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 0, 0]} intensity={2} color={color} distance={50} />
      </Canvas>
    </div>
  );
};
