import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
// @ts-ignore
import * as random from 'maath/random/dist/maath-random.esm';
import * as THREE from 'three';
import { sceneState } from '../../state/sceneState';

function ParticleField(props: any) {
  const ref = useRef<any>(null);
  const materialRef = useRef<any>(null);
  
  // Generate particles in a sphere
  // Using a yellow/gold color palette for the project
  const sphere = useMemo(() => random.inSphere(new Float32Array(5000), { radius: 1.5 }), []);

  // Base Colors
  const colorYellow = new THREE.Color('#ffe600');
  const colorData = new THREE.Color('#ffffff'); // High tech white

  useFrame((_state, delta) => {
    if (ref.current) {
      // Dynamic Speed driven by scroll orchestrator
      const currentSpeed = sceneState.speed;
      
      ref.current.rotation.x -= (delta / 15) * currentSpeed;
      ref.current.rotation.y -= (delta / 20) * currentSpeed;

      // Color Interpolation based on themeObjective
      if (materialRef.current) {
         // Lerp mostly happens visually in HSL usually but RGB is fine for simple transition
         // We blend slightly towards white during "data" phase
         materialRef.current.color.lerp(sceneState.themeObjective > 0.5 ? colorData : colorYellow, 0.05);
         
         // Pulsing size based on speed
         materialRef.current.size = THREE.MathUtils.lerp(materialRef.current.size, currentSpeed > 1 ? 0.004 : 0.003, 0.1);
      }
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]} {...props}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          ref={materialRef}
          transparent
          color="#ffe600" // Initial color
          size={0.003}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

export function Experience() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: -1, pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 0, 1] }}>
        <ParticleField />
        {/* Optional Ambient Light if we add meshes later */}
        <ambientLight intensity={0.5} />
      </Canvas>
    </div>
  );
}
