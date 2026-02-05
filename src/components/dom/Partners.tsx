import { Card } from '../ui/Card';
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const Partners = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.partner-card', {
        scrollTrigger: {
          trigger: '.partners-grid',
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

  const partners = [
    {
      name: "Yellow Network",
      desc: "Layer-3 state channel infrastructure for high-frequency cross-chain trading.",
      url: "https://yellow.org"
    },
    {
      name: "Sepolia Testnet",
      desc: "Ethereum's official merge testnet for developers.",
      url: "https://sepolia.dev"
    },
    {
      name: "ETHGlobal",
      desc: "The world's largest Ethereum hackathon and developer community.",
      url: "https://ethglobal.com"
    }
  ];

  return (
    <section ref={sectionRef} id="partners" style={{ margin: '80px 0' }}>
      <div className="section-head" style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 10px', fontSize: '1.5rem', letterSpacing: '.05em', color: '#fff' }}>
          Built With <span className="text-yellow">World-Class</span> Partners
        </h2>
        <p className="text-muted" style={{ marginTop: '5px' }}>
          Powered by cutting-edge infrastructure and community support.
        </p>
      </div>

      <div className="partners-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '18px' 
      }}>
        {partners.map((partner, i) => (
          <Card key={i} className="partner-card" style={{ background: 'rgba(12, 16, 32, 0.4)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', margin: '0 0 12px', color: 'var(--yellow)' }}>
              {partner.name}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 16px' }}>
              {partner.desc}
            </p>
            <a 
              href={partner.url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                fontSize: '0.8rem', 
                fontFamily: 'var(--mono)', 
                color: 'var(--yellow)',
                textDecoration: 'none'
              }}
            >
              Visit →
            </a>
          </Card>
        ))}
      </div>
    </section>
  );
};
