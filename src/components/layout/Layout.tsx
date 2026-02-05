import { Experience } from '../canvas/Experience';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
      {/* Animated Stars Background */}
      <div className="stars" aria-hidden="true"></div>
      
      {/* 
        Aquí irá el Canvas 3D (Background L3)
      */}
      <Experience />
      
      {/* Contenido DOM (L2) */}
      <main className="wrap">
        {children}
      </main>
      
      {/* Overlay Effects (L1) (Optional, like vignettes or grain) */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.1) 100%)',
          zIndex: 0
        }} 
      />
    </div>
  );
}
