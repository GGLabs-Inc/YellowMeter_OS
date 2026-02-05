import { Layout } from './components/layout/Layout';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Architecture } from './components/dom/Architecture';
import { UseCases } from './components/dom/UseCases';
import { DemoDashboard } from './components/dom/DemoDashboard'; // Added Demo
import { useLayoutEffect, useRef } from 'react'; // Added Hooks
import gsap from 'gsap'; // Added GSAP

function App() {
  const contentRef = useRef<HTMLDivElement>(null); // Ref for animation

  // Entry Animation
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Timeline for cleaner sequencing
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from('.hero-badge', { y: 20, opacity: 0, duration: 0.8 })
        .from('.hero-title', { y: 40, opacity: 0, duration: 1, stagger: 0.1 }, '-=0.6')
        .from('.hero-text', { y: 20, opacity: 0, duration: 0.8 }, '-=0.8')
        .from('.hero-chips', { scale: 0.9, opacity: 0, duration: 0.6 }, '-=0.6')
        .from('.hero-actions', { y: 10, opacity: 0, duration: 0.5 }, '-=0.4')
        .from('.info-card', { y: 30, opacity: 0, duration: 0.8, stagger: 0.2 }, '-=0.2');

    }, contentRef);

    return () => ctx.revert();
  }, []);

  return (
    <Layout>
      <Header />
      
      <div ref={contentRef} style={{ padding: '40px 0 80px' }}>
        {/* --- HERO SECTION --- */}
        <section className="hero" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '18px', marginBottom: '40px' }}>
          <Card>
            <div className="hero-badge" style={{ fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '.12em', color: 'rgba(231,234,243,.75)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span className="status-dot green"></span>
              Available on Testnet
            </div>
            
            <h2 className="hero-title" style={{ fontSize: '3rem', lineHeight: 1.1, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
              Action-based Economic <br />
              Sessions for <span style={{ color: 'var(--yellow)' }}>Web3</span>
            </h2>
            
            <p className="hero-text" style={{ fontSize: '1.1rem', color: 'var(--muted)', maxWidth: '650px', marginBottom: '24px', lineHeight: 1.6 }}>
              YellowMeter OS converts digital actions into economic units off-chain.
              Execute thousands of actions instantly with <strong style={{ color: '#fff' }}>zero gas per action</strong> and settle with a single on-chain transaction.
            </p>

            <div className="hero-chips" style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
              <span className="chip">
                <strong>1 Deposit</strong> → ∞ Actions
              </span>
               <span className="chip">
                <strong>Instant</strong> Settlement
              </span>
               <span className="chip">
                <strong>Non-Custodial</strong>
              </span>
            </div>

            <div className="hero-actions" style={{ display: 'flex', gap: '12px' }}>
              <Button size="lg">Start Session Demo</Button>
              <Button variant="secondary" size="lg">Read Docs</Button>
            </div>
          </Card>
        </section>

        {/* --- COMPARISON / INFO --- */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
          
          {/* Card 1: Problem */}
          <Card className="info-card" style={{ background: 'rgba(12, 16, 32, 0.4)' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1.2rem' }}>The Problem</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Web3 charges for <strong>transactions</strong>, not actions. 
              High-frequency apps (Gaming, AI, Social) are impossible with gas fees and wallet popups for every move.
            </p>
          </Card>

          {/* Card 2: Solution */}
          <Card className="info-card" style={{ background: 'rgba(12, 16, 32, 0.4)', borderColor: 'rgba(255, 230, 0, 0.3)' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1.2rem', color: 'var(--yellow)' }}>The YellowMeter Fix</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
              <strong>Pay for what you do.</strong> Open a session, perform 100+ actions off-chain, and settle once. 
              Experience Web2 speed with Web3 security.
            </p>
          </Card>

        </section>

        {/* --- USE CASES SECTION --- */}
        <UseCases />

        {/* --- INTERACTIVE DEMO --- */}
        <DemoDashboard />

        <div style={{ height: '40px' }} />

        {/* --- ARCHITECTURE SECTION --- */}
        <Architecture />

        <Footer />

      </div>
    </Layout>
  )
}

export default App
