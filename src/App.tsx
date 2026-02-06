import { ReactBitsHyperspeed } from './components/3d/ReactBitsHyperspeed';
import CinematicOverlay from './components/CinematicOverlay';

function App() {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <ReactBitsHyperspeed 
          roadSpeed={1.5}
          roadWidth={10}
          islandWidth={2}
          fov={90}
          colors={{
            shoulderLines: 0xffe600,
            brokenLines: 0xffe600,
            roadColor: 0x0a0a0a,
            islandColor: 0x050505,
            background: 0x000000
          }}
        />
      </div>
      
      <div style={{ position: 'relative', zIndex: 10 }}>
        <CinematicOverlay />
      </div>
    </>
  )
}

export default App;
