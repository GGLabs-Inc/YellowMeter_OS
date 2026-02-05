// Global mutable state for the 3D Orchestrator
// This avoids React Context overhead for high-frequency loop (useFrame)
export const sceneState = {
  // 0: Intro, 1: Architecture, 2: HowItWorks...
  scrollProgress: 0,
  
  // Modifiers
  speed: 1,      // 1 = normal, 5 = warp speed
  dispersion: 0, // 0 = sphere, 1 = exploded
  
  // Color target (We'll interpolate in the shader/loop)
  // 0 = Brand Yellow, 1 = Tech Blue/White for Architecture
  themeObjective: 0,
};
