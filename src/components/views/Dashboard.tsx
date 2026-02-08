import { useState } from 'react';
import { Bot, Code2, Trophy, CandlestickChart, MessageCircle } from 'lucide-react';
import { DashboardCard } from '../ui/DashboardCard';
import { useSession } from '../../context/SessionContext';
import { DepositModal } from '../modals/DepositModal';
import { ChessModal } from '../modals/ChessModal';
import { AiChatModal } from '../modals/AiChatModal';
import { MicroApiModal } from '../modals/MicroApiModal';
import { GamesHubModal } from '../modals/GamesHubModal';
import { TradingModal } from '../modals/TradingModal';
import { MessagingModal } from '../modals/MessagingModal';

// Main Dashboard Component
export function Dashboard() {
  const { isChannelOpen } = useSession();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isChessModalOpen, setIsChessModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isGamesHubOpen, setIsGamesHubOpen] = useState(false);
  const [isTradingModalOpen, setIsTradingModalOpen] = useState(false);
  const [isMessagingModalOpen, setIsMessagingModalOpen] = useState(false);
  const [selectedStake, setSelectedStake] = useState(10);

  const handleAppClick = (appName: string) => {
    if (!isChannelOpen) {
      setIsDepositModalOpen(true);
      return;
    }
    
    if (appName === 'Chess') {
        setIsGamesHubOpen(true);
    } else if (appName === 'AI') {
        setIsAiModalOpen(true);
    } else if (appName === 'API') {
        setIsApiModalOpen(true);
    } else if (appName === 'Trading') {
        setIsTradingModalOpen(true);
    } else if (appName === 'Messaging') {
        setIsMessagingModalOpen(true);
    }
  };

  const handleStartGame = (gameId: string, stake: number) => {
      console.log(`Starting ${gameId} with stake ${stake}`);
      setSelectedStake(stake);
      setIsGamesHubOpen(false);
      setIsChessModalOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto px-4">
        
        {/* NEW 0. Messaging Chat */}
        <DashboardCard
          title="Messaging Chat"
          price="Free"
          description="Search for friends' ENS profiles and chat with Yellow's security."
          whyYellow="Unified identity and privacy guaranteed by the network."
          buttonText="Search and Chat"
          icon={<MessageCircle size={24} />}
          onClick={() => handleAppClick('Messaging')}
        />

        {/* 1. AI Inference */}
        <DashboardCard
          title="AI Inference"
          price="$0.02"
          description="Request an answer from an AI model (LLM) paying for exact usage."
          whyYellow="Today paying $0.02 would cost $5+ in Ethereum gas. Here gas is $0."
          buttonText="Open Chat"
          icon={<Bot size={24} />}
          onClick={() => handleAppClick('AI')}
        />

        {/* 2. Micro-API */}
        <DashboardCard
          title="Micro-API"
          price="$0.005"
          description="Buy real-time data (ETH Price, Weather, Sport score)."
          whyYellow="Real micropayments are impossible on L1 due to fees. Here they are viable."
          buttonText="Open API Console"
          icon={<Code2 size={24} />}
          onClick={() => handleAppClick('API')}
        />

        {/* 3. P2P Betting */}
        <DashboardCard
          title="P2P Betting"
          badge="Wager"
          description="Play Chess betting USDC. Free off-chain moves (signatures only)."
          whyYellow="You only pay gas when settling the winner. The game happens entirely off-chain."
          buttonText="Start Wager"
          icon={<Trophy size={24} />}
          onClick={() => handleAppClick('Chess')}
        />

        {/* 4. Yellow DEX (Full Width) */}
        <div className="md:col-span-3">
          <DashboardCard
              className="h-auto"
              variant="highlight"
              title="Yellow DEX"
              badge="Perps"
              description="Perpetual Futures with 100% On-Chain order book but with Off-Chain UX."
              whyYellow="Zero-Block-Time trading. Price updates every 100ms without waiting for block confirmation."
              buttonText="Launch Terminal"
              icon={<CandlestickChart size={24} />}
              onClick={() => handleAppClick('Trading')}
          />
        </div>
      </div>

      <DepositModal 
        isOpen={isDepositModalOpen} 
        onClose={() => setIsDepositModalOpen(false)} 
      />
      
      <ChessModal
        isOpen={isChessModalOpen}
        onClose={() => setIsChessModalOpen(false)}
        stake={selectedStake}
      />

      <AiChatModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />

      <MicroApiModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
      />

       <MessagingModal 
          isOpen={isMessagingModalOpen}
          onClose={() => setIsMessagingModalOpen(false)}
      />

      <GamesHubModal
        isOpen={isGamesHubOpen}
        onClose={() => setIsGamesHubOpen(false)}
        onStartGame={handleStartGame}
      />

      <TradingModal
        isOpen={isTradingModalOpen}
        onClose={() => setIsTradingModalOpen(false)}
      />
    </>
  );
}
