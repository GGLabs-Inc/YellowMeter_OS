import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const DemoDashboard = () => {
    const [balance, setBalance] = useState(100.00);
    const [actions, setActions] = useState(0);

    const handleAction = (cost: number) => {
        setBalance(prev => Math.max(0, prev - cost));
        setActions(prev => prev + 1);
    };

    return (
        <section style={{ margin: '80px 0' }}>
            <div className="section-head" style={{ marginBottom: '30px', textAlign: 'center' }}>
                <div style={{ 
                    display: 'inline-block', 
                    padding: '6px 16px', 
                    borderRadius: '20px', 
                    background: 'rgba(255, 230, 0, 0.1)', 
                    color: 'var(--yellow)',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    marginBottom: '16px',
                    border: '1px solid rgba(255, 230, 0, 0.2)'
                }}>
                    INTERACTIVE PREVIEW
                </div>
                <h2 style={{ fontSize: '2rem', margin: '0 0 10px' }}>
                    The <span className="text-yellow">Action</span> Economy
                </h2>
                <p className="text-muted" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    Experience <strong>0 gas</strong> and <strong>50ms latency</strong>. 
                    Click the actions below to simulate a live State Channel session.
                </p>
            </div>

            {/* SIMULATED DASHBOARD CONTAINER */}
            <div style={{ 
                background: '#0d1117', 
                border: '1px solid var(--line)', 
                borderRadius: '16px', 
                padding: '20px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
                
                {/* STATUS BAR */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '16px 24px', 
                    background: 'rgba(255,255,255,0.03)', 
                    borderRadius: '12px',
                    marginBottom: '24px',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div style={{ display: 'flex', gap: '32px' }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', letterSpacing: '0.05em' }}>SESSION BALANCE</div>
                            <div style={{ fontSize: '1.5rem', fontFamily: 'var(--mono)', color: '#fff' }}>
                                {balance.toFixed(2)} <span style={{ fontSize: '1rem', color: 'var(--muted)' }}>USDC</span>
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', letterSpacing: '0.05em' }}>SIGNED ACTIONS</div>
                            <div style={{ fontSize: '1.5rem', fontFamily: 'var(--mono)', color: 'var(--yellow)' }}>{actions}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                         <span style={{ width: '8px', height: '8px', background: '#00ff88', borderRadius: '50%', boxShadow: '0 0 10px #00ff88' }}></span>
                         <span style={{ fontSize: '0.85rem', color: '#00ff88', fontFamily: 'var(--mono)' }}>CHANNEL OPEN</span>
                    </div>
                </div>

                {/* ACTION GRID */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    
                    {/* CARD 1: AI */}
                    <DashboardCard 
                        title="AI Inference" 
                        price="$0.02" 
                        icon="🤖"
                        desc="Query LLMs per-token without signing transactions."
                        reason="Standard Gas: $5.00+ vs Yellow: $0.00"
                        onAction={() => handleAction(0.02)}
                        btnText="Simulate Prompt"
                    />

                    {/* CARD 2: API */}
                    <DashboardCard 
                        title="Micro-API" 
                        price="$0.005" 
                        icon="⚡"
                        desc="Buy real-time data feeds (Sports, Weather, Stocks)."
                        reason="Enables pay-per-request business models."
                        onAction={() => handleAction(0.005)}
                        btnText="Buy Data Packet"
                    />

                    {/* CARD 3: GAMING */}
                    <DashboardCard 
                        title="P2P Chess" 
                        price="Wager" 
                        icon="♟️"
                        desc="Validate moves off-chain. Only settle the winner."
                        reason="100 moves, 0 gas. Instant finality."
                        onAction={() => handleAction(0)} // No cost to move
                        btnText="Make Move (Free)"
                    />

                     {/* CARD 4: TRADING */}
                     <DashboardCard 
                        title="Yellow DEX" 
                        price="Perps" 
                        icon="📊"
                        desc="High-frequency order matching engine."
                        reason="CEX experience with non-custodial security."
                        onAction={() => handleAction(0)} 
                        btnText="Place Order"
                    />

                </div>
            </div>
        </section>
    );
};

// Internal Sub-component for the grid items
const DashboardCard = ({ title, price, icon, desc, reason, onAction, btnText }: any) => {
    return (
        <Card style={{ background: '#161b22', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ 
                    width: '40px', height: '40px', 
                    borderRadius: '8px', background: 'rgba(255, 230, 0, 0.1)', 
                    color: 'var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' 
                }}>
                    {icon}
                </div>
                <div style={{ 
                    background: 'rgba(255,255,255,0.1)', 
                    padding: '4px 8px', borderRadius: '4px', 
                    fontSize: '0.75rem', fontFamily: 'var(--mono)' 
                }}>
                    {price}
                </div>
            </div>
            
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 8px', color: '#fff' }}>{title}</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--muted)', margin: '0 0 16px', lineHeight: 1.5, minHeight: '40px' }}>
                {desc}
            </p>

            <div style={{ 
                fontSize: '0.8rem', 
                padding: '10px', 
                background: 'rgba(0,0,0,0.3)', 
                borderRadius: '8px', 
                marginBottom: '16px',
                color: 'rgba(255,255,255,0.7)'
            }}>
                <strong style={{ color: 'var(--yellow)' }}>Why Yellow?</strong><br/>
                {reason}
            </div>

            <Button variant="secondary" style={{ width: '100%', fontSize: '0.85rem' }} onClick={onAction}>
                {btnText}
            </Button>
        </Card>
    )
}
