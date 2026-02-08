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

// Componente principal del Dashboard
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
          title="Chat de Mensajería"
          price="Free"
          description="Busca perfiles de amigos en ENS y chatea con la seguridad de Yellow."
          whyYellow="Identidad unificada y privacidad garantizada por la red."
          buttonText="Buscar y Chatear"
          icon={<MessageCircle size={24} />}
          onClick={() => handleAppClick('Messaging')}
        />

        {/* 1. AI Inference */}
        <DashboardCard
          title="AI Inference"
          price="$0.02"
          description="Solicita una respuesta a un modelo de IA (LLM) pagando por uso exacto."
          whyYellow="Hoy pagar $0.02 costaría $5+ de gas en Ethereum. Aquí el gas es $0."
          buttonText="Abrir Chat"
          icon={<Bot size={24} />}
          onClick={() => handleAppClick('AI')}
        />

        {/* 2. Micro-API */}
        <DashboardCard
          title="Micro-API"
          price="$0.005"
          description="Compra un dato en tiempo real (Precio ETH, Clima, Sport score)."
          whyYellow="Los micropagos reales son imposibles en L1 por las fees. Aquí son viables."
          buttonText="Abrir Consola API"
          icon={<Code2 size={24} />}
          onClick={() => handleAppClick('API')}
        />

        {/* 3. P2P Betting */}
        <DashboardCard
          title="P2P Betting"
          badge="Wager"
          description="Juega Ajedrez apostando USDC. Movimientos off-chain gratuitos (solo firmas)."
          whyYellow="Solo pagas gas al liquidar al ganador. La partida ocurre enteramente off-chain."
          buttonText="Iniciar Apuesta"
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
              description="Futuros Perpetuos con libro de órdenes 100% On-Chain pero con UX de Off-Chain."
              whyYellow="Zero-Block-Time trading. Actualizaciones de precio cada 100ms sin espera de confirmación de bloque."
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
