import { useState } from 'react';
import { ConnectButton, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider, useAccount } from 'wagmi'
import { config } from './config/Config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@rainbow-me/rainbowkit/styles.css';

import { ReactBitsHyperspeed } from './components/3d/ReactBitsHyperspeed';
import CinematicOverlay from './components/CinematicOverlay';
import { SessionProvider } from './context/SessionContext';
import { Dashboard } from './components/views/Dashboard';
import { StateBar } from './components/layout/StateBar';
import { SettlementModal } from './components/modals/SettlementModal';

const queryClient = new QueryClient()

function MainLayout() {
  const { isConnected } = useAccount();
  const [isSettlementOpen, setIsSettlementOpen] = useState(false);

  if (isConnected) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans flex flex-col relative overflow-hidden">
        {/* Reuse the hyperspeed background but maybe slower or dimmed? or just dark bg */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.2 }}>
            <ReactBitsHyperspeed 
            roadSpeed={0.5}
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
        </div>

        {/* Navbar */}
        <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-yellow-400 rounded-sm transform rotate-45 shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
              <h1 className="text-xl font-bold tracking-tight text-white">YellowMeter <span className="text-yellow-400">OS</span></h1>
            </div>
            <ConnectButton />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow flex flex-col items-center justify-center p-6 gap-8 relative z-10">
          
          <StateBar onSettle={() => setIsSettlementOpen(true)} />
          <Dashboard />

        </main>
        
        {/* Footer */}
        <footer className="py-6 text-center text-sm text-gray-600 border-t border-white/5 mt-auto relative z-10 bg-black/80">
          Powering the Next Gen of <span className="text-yellow-500">GameFi</span> & <span className="text-yellow-500">AI Agents</span>
        </footer>

        <SettlementModal 
            isOpen={isSettlementOpen}
            onClose={() => setIsSettlementOpen(false)}
        />
      </div>
    );
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
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
      </div>
      
      <div style={{ position: 'relative', zIndex: 10 }}>
        <CinematicOverlay />
      </div>
    </>
  )
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider locale="en-US">
          <SessionProvider>
            <MainLayout />
          </SessionProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App;
