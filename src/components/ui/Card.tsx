import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  noPadding?: boolean;
}

export const Card = ({ children, className = '', style = {}, noPadding = false }: CardProps) => {
  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, rgba(12,16,32,.80), rgba(10,13,24,.68))',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    overflow: 'hidden',
    position: 'relative',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    ...style
  };

  const innerStyle: React.CSSProperties = {
    padding: noPadding ? '0' : '18px 18px 16px',
    position: 'relative',
    zIndex: 1
  };

  return (
    <div 
      className={`card hover-lift ${className}`} 
      style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)';
        e.currentTarget.style.boxShadow = '0 20px 60px rgba(255, 230, 0, 0.2), 0 0 40px rgba(255, 230, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow)';
      }}
    >
      {/* Background Gradients Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: `
          radial-gradient(600px 250px at 18% 0%, rgba(255,230,0,.12), transparent 60%),
          radial-gradient(520px 260px at 88% 15%, rgba(255,100,0,.10), transparent 60%),
          radial-gradient(540px 300px at 55% 120%, rgba(255,230,0,.05), transparent 60%)
        `
      }} />
      
      <div style={innerStyle}>
        {children}
      </div>
    </div>
  );
};
