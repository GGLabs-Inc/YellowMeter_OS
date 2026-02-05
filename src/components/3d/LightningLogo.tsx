import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

const Lightning3D = () => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
      groupRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  // Lightning bolt shape
  const lightningShape = new THREE.Shape();
  lightningShape.moveTo(0, 1);
  lightningShape.lineTo(-0.3, 0.2);
  lightningShape.lineTo(0, 0.3);
  lightningShape.lineTo(-0.2, -0.8);
  lightningShape.lineTo(0.1, -0.1);
  lightningShape.lineTo(-0.1, 0);
  lightningShape.lineTo(0.3, 0.6);
  lightningShape.lineTo(0, 1);

  const extrudeSettings = {
    depth: 0.15,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.02,
    bevelSegments: 3
  };

  return (
    <group ref={groupRef} scale={0.8}>
      <mesh ref={meshRef} castShadow>
        <extrudeGeometry args={[lightningShape, extrudeSettings]} />
        <meshStandardMaterial 
          color="#FFE600"
          emissive="#FFE600"
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Glow effect */}
      <pointLight position={[0, 0, 0.5]} intensity={2} color="#FFE600" distance={3} />
    </group>
  );
};

export const LightningLogo = () => {
  return (
    <div style={{ 
      width: '34px', 
      height: '34px', 
      borderRadius: '10px',
      background: 'linear-gradient(145deg, rgba(255, 230, 0, .15), rgba(12, 16, 32, .8))',
      boxShadow: '0 0 0 1px rgba(255, 230, 0, .25), 0 18px 40px rgba(0,0,0,.45)',
      overflow: 'hidden',
      cursor: 'pointer'
    }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 35 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[2, 2, 2]} intensity={1} />
        <Lightning3D />
      </Canvas>
    </div>
  );
};
