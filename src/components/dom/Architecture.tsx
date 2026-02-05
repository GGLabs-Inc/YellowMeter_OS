import { Card } from '../ui/Card';
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sceneState } from '../../state/sceneState';

gsap.registerPlugin(ScrollTrigger);

export const Architecture = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Enter Animation (UI)
      gsap.from('.arch-title', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
      });

      gsap.from('.arch-step', {
        scrollTrigger: {
          trigger: '.arch-grid',
          start: 'top 75%',
        },
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power2.out'
      });

      // 2. ORCHESTRATOR: Drive 3D Scene via Scroll
      // When users scroll through Architecture, speed up particles and shift color
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top bottom',
        end: 'bottom top',
        onEnter: () => {
             // Warp speed when entering data section
             gsap.to(sceneState, { speed: 5, themeObjective: 1, duration: 1 });
        },
        onLeaveBack: () => {
             // Return to calm yellow when going back up
             gsap.to(sceneState, { speed: 1, themeObjective: 0, duration: 1 });
        },
        onLeave: () => {
             // Return to normal if passed
             gsap.to(sceneState, { speed: 1, themeObjective: 0, duration: 1 });
        },
        onEnterBack: () => {
             // Warp again when entering from bottom
             gsap.to(sceneState, { speed: 5, themeObjective: 1, duration: 1 });
        }
      });
      
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="architecture" style={{ position: 'relative', zIndex: 10 }}>
        <div style={{ padding: '0 0 60px' }}>
            <div className="section-head" style={{ 
                display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', 
                padding: '0 0 20px', borderBottom: '1px solid var(--line)', marginBottom: '40px' 
            }}>
                <h2 className="arch-title" style={{ margin: 0, fontSize: '16px', letterSpacing: '.08em', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>
                    Architecture
                </h2>
                <div className="arch-title" style={{ color: 'rgba(231,234,243,.65)', fontSize: '12px', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.12em' }}>
                    How it works
                </div>
            </div>

            <div className="arch-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                
                {/* Step 1 */}
                <Card className="arch-step" style={{ background: 'rgba(12,16,32,0.6)' }} noPadding>
                    <div style={{ padding: '24px' }}>
                        <div style={{ 
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '40px', height: '40px', borderRadius: '12px',
                            background: 'rgba(255,230,0,0.1)', color: 'var(--yellow)',
                            border: '1px solid var(--yellow)', fontFamily: 'var(--mono)',
                            marginBottom: '20px', fontSize: '14px'
                        }}>01</div>
                        
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '10px' }}>Session Safe</h3>
                        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                           Users deposit funds into a <strong>smart contract</strong> (ERC-20). This creates a trustless escrow that holds the balance for the session duration.
                        </p>
                    </div>
                </Card>

                {/* Step 2 */}
                <Card className="arch-step" style={{ background: 'rgba(12,16,32,0.6)', borderColor: 'var(--yellow)' }} noPadding>
                    <div style={{ padding: '24px' }}>
                         <div style={{ 
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '40px', height: '40px', borderRadius: '12px',
                            background: 'var(--yellow)', color: '#000',
                            fontWeight: 'bold',
                            marginBottom: '20px', fontSize: '14px'
                        }}>02</div>

                        <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: 'var(--yellow)' }}>Yellow State Channel</h3>
                        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                            Actions happen <strong>off-chain</strong> via Nitrolite SDK. Every interaction updates the cryptographic state instantly with zero gas fees.
                        </p>
                    </div>
                </Card>

                {/* Step 3 */}
                <Card className="arch-step" style={{ background: 'rgba(12,16,32,0.6)' }} noPadding>
                    <div style={{ padding: '24px' }}>
                         <div style={{ 
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '40px', height: '40px', borderRadius: '12px',
                            background: 'rgba(255,230,0,0.1)', color: 'var(--yellow)',
                            border: '1px solid var(--yellow)', fontFamily: 'var(--mono)',
                            marginBottom: '20px', fontSize: '14px'
                        }}>03</div>

                        <h3 style={{ fontSize: '1.25rem', marginBottom: '10px' }}>Single Settlement</h3>
                        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                            When the session ends, the final state is submitted on-chain. The contract verifies signatures and settles funds in <strong>one transaction</strong>.
                        </p>
                    </div>
                </Card>

            </div>

            {/* Technical Detail */}
             <div className="arch-step" style={{ marginTop: '30px' }}>
                <Card style={{ background: 'linear-gradient(180deg, rgba(255,230,0,.08), rgba(12,16,32,.30))', borderColor: 'rgba(255,230,0,.2)' }}>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ flex: 1, minWidth: '280px' }}>
                            <h4 style={{ margin: '0 0 8px', fontFamily: 'var(--mono)', fontSize: '13px', textTransform: 'uppercase', color: 'var(--yellow)', letterSpacing: '.08em' }}>
                                Powered by Nitrolite
                            </h4>
                            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
                                The Yellow Network stack allows us to process thousands of transactions per second, enabling real-time metering for AI and Games.
                            </p>
                        </div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', padding: '10px 16px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ color: 'var(--muted)' }}>// Yellow SDK</span><br/>
                            <span style={{ color: '#ff79c6' }}>await</span> nitrolite.<span style={{ color: '#8be9fd' }}>updateState</span>(channelId, state);
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    </section>
  );
};
