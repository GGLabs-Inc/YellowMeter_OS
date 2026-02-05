export const Footer = () => {
    return (
      <footer style={{ 
          marginTop: '80px', 
          borderTop: '1px solid var(--line)', 
          padding: '40px 0',
          textAlign: 'center',
          color: 'var(--muted)',
          fontSize: '0.9rem',
          position: 'relative',
          zIndex: 10
      }}>
          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--yellow)', fontSize: '1.2rem' }}>YellowMeter OS</span>
          </div>
          <p style={{ margin: '0 0 10px', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
            Built for <strong>ETHGlobal HackMoney 2026</strong>. Powered by Yellow Network State Channels.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px', fontFamily: 'var(--mono)', fontSize: '0.8rem' }}>
              <a href="#" style={{ color: 'var(--text)' }}>Github</a>
              <a href="#" style={{ color: 'var(--text)' }}>Documentation</a>
              <a href="#" style={{ color: 'var(--text)' }}>Demo Video</a>
          </div>
          <div style={{ marginTop: '40px', opacity: 0.5, fontSize: '0.75rem' }}>
              © 2026 YellowMeter Project. All rights reserved.
          </div>
      </footer>
    )
  }
