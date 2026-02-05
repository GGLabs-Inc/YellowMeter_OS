import { ConnectButton } from '@rainbow-me/rainbowkit';
import { LightningLogo } from '../3d/LightningLogo';

export const Header = () => {
  return (
    <header className="hud" style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(10px)',
      background: 'linear-gradient(180deg, rgba(7,9,15,.84), rgba(7,9,15,.55))',
      borderBottom: '1px solid var(--line)',
    }}>
      <div className="hud-inner" style={{
        maxWidth: '1160px',
        margin: '0 auto',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        justifyContent: 'space-between',
      }}>
        {/* Brand */}
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px' }}>
          <LightningLogo />
          <div>
            <h1 style={{ margin: 0, fontSize: '14px', letterSpacing: '.12em', textTransform: 'uppercase', lineHeight: 1.2 }}>YellowMeter OS</h1>
            <span className="sub" style={{ display: 'block', marginTop: '3px', fontSize: '12px', letterSpacing: '.06em', color: 'var(--muted)', textTransform: 'none' }}>
              Action-based Sessions
            </span>
          </div>
        </div>

        {/* Navigation & Wallet */}
        <div className="nav" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <nav style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
                <a href="#use-cases" className="nav-pill">Use Cases</a>
                <a href="#how-it-works" className="nav-pill">How It Works</a>
                <a href="#architecture" className="nav-pill">Architecture</a>
            </nav>
            
            {/* RainbowKit Connect Button custom styled or default */}
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus ||
                    authenticationStatus === 'authenticated');

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      'style': {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button onClick={openConnectModal} type="button" className="btn" style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              padding: '8px 16px', borderRadius: '12px',
                              border: '1px solid rgba(255,230,0,.3)',
                              background: 'linear-gradient(180deg, rgba(255,230,0,.15), rgba(12,16,32,.22))',
                              color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer'
                          }}>
                            Connect Wallet
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button onClick={openChainModal} type="button" style={{ 
                              background: '#ff494a', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' 
                          }}>
                            Wrong network
                          </button>
                        );
                      }

                      return (
                        <div style={{ display: 'flex', gap: 12 }}>
                          <button
                            onClick={openChainModal}
                            style={{ display: 'flex', alignItems: 'center', background: 'rgba(12,16,32,0.5)', border: '1px solid var(--line)', padding: '6px 12px', borderRadius: '8px', color: 'var(--text)', cursor: 'pointer' }}
                            type="button"
                          >
                            {chain.hasIcon && (
                              <div
                                style={{
                                  background: chain.iconBackground,
                                  width: 12,
                                  height: 12,
                                  borderRadius: 999,
                                  overflow: 'hidden',
                                  marginRight: 4,
                                }}
                              >
                                {chain.iconUrl && (
                                  <img
                                    alt={chain.name ?? 'Chain icon'}
                                    src={chain.iconUrl}
                                    style={{ width: 12, height: 12 }}
                                  />
                                )}
                              </div>
                            )}
                            {chain.name}
                          </button>

                          <button onClick={openAccountModal} type="button" style={{ 
                              background: 'rgba(255,230,0,0.1)', border: '1px solid rgba(255,230,0,0.3)', color: 'var(--yellow)',
                              padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600
                          }}>
                            {account.displayName}
                            {account.displayBalance
                              ? ` (${account.displayBalance})`
                              : ''}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
        </div>
      </div>
    </header>
  );
};
