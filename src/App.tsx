import { Layout } from './components/layout/Layout';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Preloader } from './components/layout/Preloader';
import { ReactBitsHyperspeed } from './components/3d/ReactBitsHyperspeed';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { AnimatedText, FadeInUp } from './components/ui/AnimatedText';
import { Architecture } from './components/dom/Architecture';
import { UseCases } from './components/dom/UseCases';
import { DemoDashboard } from './components/dom/DemoDashboard';
import { Partners } from './components/dom/Partners';
import { useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';

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
    <>
      <Preloader />
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
      <Layout>
        <Header />
      
      <div ref={contentRef} style={{ padding: '40px 0 80px' }}>
        {/* --- HERO SECTION --- */}
        <section className="hero" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '18px', marginBottom: '40px' }}>
          <Card className="glow-border">
            <AnimatedText delay={0.2}>
              <div className="hero-badge" style={{ fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '.12em', color: 'rgba(231,234,243,.75)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <motion.span 
                  className="status-dot green"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                ></motion.span>
                Available on Testnet
              </div>
            </AnimatedText>
            
            <AnimatedText delay={0.4}>
              <h2 className="hero-title" style={{ fontSize: '3rem', lineHeight: 1.1, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
                Action-based Economic <br />
                Sessions for <span className="gradient-text" style={{ fontWeight: 'bold' }}>Web3</span>
              </h2>
            </AnimatedText>
            <AnimatedText delay={0.6}>
              <p className="hero-text" style={{ fontSize: '1.1rem', color: 'var(--muted)', maxWidth: '650px', marginBottom: '24px', lineHeight: 1.6 }}>
                YellowMeter OS converts digital actions into economic units off-chain.
                Execute thousands of actions instantly with <strong style={{ color: '#fff' }}>zero gas per action</strong> and settle with a single on-chain transaction.
              </p>
            </AnimatedText>

            <AnimatedText delay={0.8}>
              <div className="hero-chips" style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
                {['1 Deposit → ∞ Actions', 'Instant Settlement', 'Non-Custodial'].map((text, i) => (
                  <motion.span 
                    key={i}
                    className="chip hover-scale"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <strong>{text.split(' ')[0]}</strong> {text.split(' ').slice(1).join(' ')}
                  </motion.span>
                ))}
              </div>
            </AnimatedText>

            <AnimatedText delay={1}>
              <div className="hero-actions" style={{ display: 'flex', gap: '12px' }}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg">Start Session Demo</Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="secondary" size="lg">Read Docs</Button>
                </motion.div>
              </div>
            </AnimatedText>
          </Card>
        </section>

        {/* --- COMPARISON / INFO --- */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
          
          {/* Card 1: Problem */}
          <FadeInUp delay={0}>
            <Card className="info-card hover-glow" style={{ background: 'rgba(12, 16, 32, 0.4)' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '1.2rem' }}>The Problem</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Web3 charges for <strong>transactions</strong>, not actions. 
                High-frequency apps (Gaming, AI, Social) are impossible with gas fees and wallet popups for every move.
              </p>
            </Card>
          </FadeInUp>

          {/* Card 2: Solution */}
          <FadeInUp delay={0.2}>
            <Card className="info-card glow-border" style={{ background: 'rgba(12, 16, 32, 0.4)', borderColor: 'rgba(255, 230, 0, 0.3)' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '1.2rem' }}>
                <span className="gradient-text">The YellowMeter Fix</span>
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                <strong>Pay for what you do.</strong> Open a session, perform 100+ actions off-chain, and settle once. 
                Experience Web2 speed with Web3 security.
              </p>
            </Card>
          </FadeInUp>

        </section>

        {/* --- USE CASES SECTION --- */}
        <UseCases />

        {/* --- INTERACTIVE DEMO --- */}
        <DemoDashboard />

        <div style={{ height: '40px' }} />

        {/* --- ARCHITECTURE SECTION --- */}
        <Architecture />

        {/* --- PARTNERS SECTION --- */}
        <Partners />

        <Footer />

      </div>
    </Layout>
    </>
  )
}

export default App
