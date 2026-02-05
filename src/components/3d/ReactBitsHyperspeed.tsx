import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer, Bloom, SMAA } from '@react-three/postprocessing';

interface HyperspeedProps {
  roadWidth?: number;
  islandWidth?: number;
  lanesPerRoad?: number;
  roadLength?: number;
  roadSpeed?: number;
  fov?: number;
  colors?: {
    roadColor?: number;
    islandColor?: number;
    background?: number;
    shoulderLines?: number;
    brokenLines?: number;
    leftCars?: number[];
    rightCars?: number[];
  };
}

// Carretera principal
const Road = ({ 
  roadWidth = 10, 
  islandWidth = 2, 
  roadLength = 400, 
  speed = 2,
  roadColor = 0x101010,
  islandColor = 0x0a0a0a
}: any) => {
  const roadLeftRef = useRef<THREE.Mesh>(null!);
  const roadRightRef = useRef<THREE.Mesh>(null!);
  const islandRef = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    if (roadLeftRef.current) {
      roadLeftRef.current.position.z += speed;
      if (roadLeftRef.current.position.z > 100) {
        roadLeftRef.current.position.z = -roadLength + 100;
      }
    }
    if (roadRightRef.current) {
      roadRightRef.current.position.z += speed;
      if (roadRightRef.current.position.z > 100) {
        roadRightRef.current.position.z = -roadLength + 100;
      }
    }
    if (islandRef.current) {
      islandRef.current.position.z += speed;
      if (islandRef.current.position.z > 100) {
        islandRef.current.position.z = -roadLength + 100;
      }
    }
  });

  return (
    <>
      {/* Left Road */}
      <mesh ref={roadLeftRef} position={[-(islandWidth / 2 + roadWidth / 2), -1, -roadLength / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[roadWidth, roadLength]} />
        <meshStandardMaterial color={roadColor} />
      </mesh>

      {/* Right Road */}
      <mesh ref={roadRightRef} position={[islandWidth / 2 + roadWidth / 2, -1, -roadLength / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[roadWidth, roadLength]} />
        <meshStandardMaterial color={roadColor} />
      </mesh>

      {/* Island */}
      <mesh ref={islandRef} position={[0, -1, -roadLength / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[islandWidth, roadLength]} />
        <meshStandardMaterial color={islandColor} />
      </mesh>
    </>
  );
};

// Líneas de la carretera
const RoadLines = ({ 
  roadWidth = 10, 
  islandWidth = 2, 
  roadLength = 400, 
  speed = 2,
  shoulderColor = 0xffe600,
  brokenColor = 0xffe600
}: any) => {
  const linesRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (linesRef.current) {
      linesRef.current.children.forEach((line) => {
        line.position.z += speed;
        if (line.position.z > 50) {
          line.position.z -= roadLength;
        }
      });
    }
  });

  const lines = useMemo(() => {
    const lineArray = [];
    const segments = 40;
    const segmentLength = roadLength / segments;

    // Shoulder lines (continuas)
    const shoulderPositions = [
      [-(roadWidth + islandWidth / 2), -0.9],  // Left outer
      [-islandWidth / 2, -0.9],                 // Left inner
      [islandWidth / 2, -0.9],                  // Right inner
      [roadWidth + islandWidth / 2, -0.9]       // Right outer
    ];

    shoulderPositions.forEach(([x, y], idx) => {
      lineArray.push(
        <mesh key={`shoulder-${idx}`} position={[x, y, -roadLength / 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.1, roadLength]} />
          <meshStandardMaterial color={shoulderColor} emissive={shoulderColor} emissiveIntensity={0.5} />
        </mesh>
      );
    });

    // Broken lines (discontinuas en el centro de cada carril)
    for (let i = 0; i < segments; i++) {
      const z = -roadLength + i * segmentLength;
      
      // Left road center lines
      lineArray.push(
        <mesh key={`broken-left-${i}`} position={[-(roadWidth / 2 + islandWidth / 2), -0.9, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, segmentLength * 0.5]} />
          <meshStandardMaterial color={brokenColor} emissive={brokenColor} emissiveIntensity={0.3} />
        </mesh>
      );

      // Right road center lines
      lineArray.push(
        <mesh key={`broken-right-${i}`} position={[roadWidth / 2 + islandWidth / 2, -0.9, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, segmentLength * 0.5]} />
          <meshStandardMaterial color={brokenColor} emissive={brokenColor} emissiveIntensity={0.3} />
        </mesh>
      );
    }

    return lineArray;
  }, [roadWidth, islandWidth, roadLength, shoulderColor, brokenColor]);

  return <group ref={linesRef}>{lines}</group>;
};

// Luces laterales (light sticks)
const LightSticks = ({ 
  roadWidth = 10, 
  islandWidth = 2, 
  roadLength = 400, 
  speed = 2,
  totalSticks = 20,
  color = 0xffe600
}: any) => {
  const sticksRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (sticksRef.current) {
      sticksRef.current.children.forEach((stick) => {
        stick.position.z += speed;
        if (stick.position.z > 50) {
          stick.position.z -= roadLength;
        }
      });
    }
  });

  const sticks = useMemo(() => {
    const stickArray = [];
    const spacing = roadLength / totalSticks;

    for (let i = 0; i < totalSticks; i++) {
      const z = -roadLength + i * spacing;
      const stickHeight = 2;
      const stickWidth = 0.15;

      // Left side sticks
      stickArray.push(
        <group key={`stick-left-${i}`} position={[-(roadWidth + islandWidth / 2 + 1), 0, z]}>
          <mesh position={[0, stickHeight / 2, 0]}>
            <boxGeometry args={[stickWidth, stickHeight, stickWidth]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
          </mesh>
          <pointLight color={color} intensity={2} distance={8} position={[0, stickHeight, 0]} />
        </group>
      );

      // Right side sticks
      stickArray.push(
        <group key={`stick-right-${i}`} position={[roadWidth + islandWidth / 2 + 1, 0, z]}>
          <mesh position={[0, stickHeight / 2, 0]}>
            <boxGeometry args={[stickWidth, stickHeight, stickWidth]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
          </mesh>
          <pointLight color={color} intensity={2} distance={8} position={[0, stickHeight, 0]} />
        </group>
      );
    }

    return stickArray;
  }, [roadWidth, islandWidth, roadLength, totalSticks, color]);

  return <group ref={sticksRef}>{sticks}</group>;
};

// Escena completa
const HyperspeedScene = ({
  roadWidth = 10,
  islandWidth = 2,
  roadLength = 400,
  roadSpeed = 2,
  colors = {}
}: HyperspeedProps) => {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 3, 10);
    camera.lookAt(0, 0, -20);
  }, [camera]);

  const {
    roadColor = 0x101010,
    islandColor = 0x0a0a0a,
    background = 0x000000,
    shoulderLines = 0xffe600,
    brokenLines = 0xffe600,
  } = colors;

  return (
    <>
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[background, 10, 400]} />
      
      <ambientLight intensity={0.1} />
      
      <Road 
        roadWidth={roadWidth} 
        islandWidth={islandWidth} 
        roadLength={roadLength} 
        speed={roadSpeed}
        roadColor={roadColor}
        islandColor={islandColor}
      />
      
      <RoadLines 
        roadWidth={roadWidth} 
        islandWidth={islandWidth} 
        roadLength={roadLength} 
        speed={roadSpeed}
        shoulderColor={shoulderLines}
        brokenColor={brokenLines}
      />
      
      <LightSticks 
        roadWidth={roadWidth} 
        islandWidth={islandWidth} 
        roadLength={roadLength} 
        speed={roadSpeed}
        totalSticks={20}
        color={shoulderLines}
      />

      <EffectComposer multisampling={0}>
        <Bloom 
          intensity={1.5} 
          luminanceThreshold={0.2} 
          luminanceSmoothing={0.9}
        />
        <SMAA />
      </EffectComposer>
    </>
  );
};

// Componente exportable
export const ReactBitsHyperspeed = ({
  roadWidth = 10,
  islandWidth = 2,
  roadLength = 400,
  roadSpeed = 2,
  fov = 90,
  colors
}: HyperspeedProps) => {
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
        camera={{ position: [0, 3, 10], fov: fov, near: 0.1, far: 1000 }}
        gl={{ 
          alpha: false, 
          antialias: false,
          powerPreference: 'high-performance'
        }}
      >
        <HyperspeedScene
          roadWidth={roadWidth}
          islandWidth={islandWidth}
          roadLength={roadLength}
          roadSpeed={roadSpeed}
          colors={colors}
        />
      </Canvas>
    </div>
  );
};
