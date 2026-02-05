import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) => {
  const styleMap = {
    primary: {
      background: 'linear-gradient(180deg, rgba(255,230,0,.15), rgba(12,16,32,.22))',
      border: '1px solid rgba(255,230,0,.25)',
      color: '#fff',
      boxShadow: '0 16px 30px rgba(0,0,0,.35)',
    },
    secondary: {
      background: 'rgba(12,16,32,.45)',
      border: '1px solid rgba(231,234,243,.14)',
      color: 'var(--text)',
    },
    ghost: {
      background: 'transparent',
      border: 'none',
      color: 'var(--muted)',
    }
  };

  const commonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: size === 'sm' ? '8px' : '10px',
    padding: size === 'sm' ? '6px 10px' : size === 'lg' ? '14px 24px' : '10px 12px',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: size === 'sm' ? '12px' : '13px',
    cursor: 'pointer',
    transition: 'transform 0.2s, background 0.2s',
    ...styleMap[variant],
  };

  return (
    <button 
      className={`btn-${variant} ${className}`}
      style={commonStyle}
      onMouseEnter={(e) => {
        if (variant !== 'ghost') e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        if (variant !== 'ghost') e.currentTarget.style.transform = 'translateY(0)';
      }}
      {...props}
    >
      {children}
    </button>
  );
};
