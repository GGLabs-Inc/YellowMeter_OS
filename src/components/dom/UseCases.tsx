import { Card } from '../ui/Card';
import { FadeInUp } from '../ui/AnimatedText';
import { motion } from 'framer-motion';
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HiCpuChip, HiBolt, HiChatBubbleLeftRight } from 'react-icons/hi2';
import { IoGameController } from 'react-icons/io5';

gsap.registerPlugin(ScrollTrigger);

export const UseCases = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.case-card', {
        scrollTrigger: {
          trigger: '.cases-grid',
          start: 'top 80%',
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power2.out'
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const cases = [
    {
      title: "AI Agents & DePIN",
      desc: "Monetize generic compute, LLM inference, or RAG queries per-token or per-second without signing transactions.",
      icon: <HiCpuChip />
    },
    {
      title: "On-Chain Gaming",
      desc: "Validate movements, attacks, and loot drops off-chain. Settle the final game state and rewards in one go.",
      icon: <IoGameController />
    },
    {
      title: "High-Frequency APIs",
      desc: "Replace monthly subscriptions with real-time micropayments for API gateways and Oracle data feeds.",
      icon: <HiBolt />
    },
    {
      title: "SocialFi & Content",
      desc: "Tips, likes, and content unlocks happen instantly. No more popping up MetaMask for a $0.05 interaction.",
      icon: <HiChatBubbleLeftRight />
    }
  ];

  return (
    <section ref={sectionRef} id="use-cases" style={{ position: 'relative', zIndex: 10, margin: '60px 0' }}>
        <div className="section-head" style={{ marginBottom: '30px' }}>
             <h2 style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '.05em', color: '#fff' }}>
                Designed for <span className="text-yellow">High Velocity</span>
             </h2>
             <p className="text-muted" style={{ marginTop: '5px' }}>
                Infrastructure for applications that move faster than the blockchain.
             </p>
        </div>

        <div className="cases-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {cases.map((item, i) => (
                <FadeInUp key={i} delay={i * 0.1}>
                    <Card className="case-card hover-glow" style={{ background: 'rgba(12, 16, 32, 0.45)' }}>
                        <motion.div 
                            style={{ fontSize: '2rem', marginBottom: '16px' }}
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, delay: i * 0.2, repeat: Infinity, repeatDelay: 3 }}
                        >
                            {item.icon}
                        </motion.div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: '#fff' }}>{item.title}</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>
                            {item.desc}
                        </p>
                    </Card>
                </FadeInUp>
            ))}
        </div>
    </section>
  );
};
