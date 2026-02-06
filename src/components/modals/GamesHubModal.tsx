import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Trophy, Users, Plus, Gamepad2, Sword, Coins, ArrowLeft, Play } from 'lucide-react';

interface GamesHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (gameId: string, stake: number) => void;
}

interface GameOption {
  id: string;
  name: string;
  description: string;
  activePlayers: number;
  icon: React.ReactNode;
  isComingSoon?: boolean;
}

interface Challenge {
  id: string;
  host: string;
  stake: number;
  rating: number;
}

const GAMES: GameOption[] = [
  {
    id: 'chess',
    name: 'Speed Chess',
    description: 'Classic 10 min rapid chess. Win by checkmate or timeout.',
    activePlayers: 128,
    icon: <Sword size={32} className="text-yellow-500" />
  },
  {
    id: 'rps',
    name: 'Rock Paper Scissors',
    description: 'Best of 3. Pure psychological warfare.',
    activePlayers: 45,
    icon: <Gamepad2 size={32} className="text-purple-500" />,
    isComingSoon: true
  },
  {
    id: 'coin',
    name: 'Coin Flip',
    description: '50/50 chance. Double or nothing.',
    activePlayers: 890,
    icon: <Coins size={32} className="text-green-500" />,
    isComingSoon: true
  }
];

const MOCK_LOBBY: Challenge[] = [
  { id: 'c1', host: '0x71...3A92', stake: 5, rating: 1200 },
  { id: 'c2', host: '0x9A...B122', stake: 10, rating: 1450 },
  { id: 'c3', host: '0x1F...9981', stake: 2, rating: 900 },
  { id: 'c4', host: '0x33...112A', stake: 25, rating: 1800 },
];

export function GamesHubModal({ isOpen, onClose, onStartGame }: GamesHubModalProps) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const handleGameClick = (game: GameOption) => {
    if (game.isComingSoon) return;
    setSelectedGame(game.id);
  };

  const handleBack = () => {
    setSelectedGame(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="P2P Arcade" className="max-w-4xl">
      <div className="min-h-[500px] flex flex-col">
        
        {/* Navigation / Header Area */}
        {selectedGame && (
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/10">
            <button onClick={handleBack} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-gray-400" />
            </button>
            <div>
              <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                {GAMES.find(g => g.id === selectedGame)?.name}
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30">LOBBY LIVE</span>
              </h3>
            </div>
          </div>
        )}

        {/* CONTENT SWITCHER */}
        {!selectedGame ? (
          /* GAME SELECTION GRID */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {GAMES.map((game) => (
              <div 
                key={game.id}
                onClick={() => handleGameClick(game)}
                className={`
                  relative group border border-white/10 bg-[#15171e] p-6 rounded-xl cursor-pointer transition-all duration-300
                  ${game.isComingSoon ? 'opacity-60 grayscale' : 'hover:border-yellow-500/50 hover:bg-[#1a1d24] hover:-translate-y-1'}
                `}
              >
                <div className="mb-4 flex justify-between items-start">
                  <div className="p-3 bg-black/40 rounded-lg border border-white/5 group-hover:border-yellow-500/20 transition-colors">
                    {game.icon}
                  </div>
                  {game.isComingSoon && (
                    <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded text-white/50">SOON</span>
                  )}
                </div>
                
                <h4 className="text-lg font-bold text-white mb-2">{game.name}</h4>
                <p className="text-sm text-gray-500 mb-4 h-10">{game.description}</p>
                
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Users size={14} />
                  <span>{game.activePlayers} Playing</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* LOBBY / CHALLENGES LIST */
          <div className="flex flex-col h-full">
            
            {/* Create Actions */}
            <div className="flex justify-between items-center mb-6">
               <p className="text-gray-400 text-sm">Select a challenge to accept instantly via State Channel.</p>
               <button className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-bold text-sm transition-colors">
                 <Plus size={16} />
                 Create Challenge
               </button>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/10">
              <div className="col-span-5">Host / Rating</div>
              <div className="col-span-3 text-center">Stake (USDC)</div>
              <div className="col-span-4 text-right">Action</div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 mt-2">
              {MOCK_LOBBY.map((challenge) => (
                <div key={challenge.id} className="grid grid-cols-12 gap-4 px-4 py-4 bg-[#15171e] hover:bg-[#1e2129] border border-white/5 rounded-lg items-center transition-colors">
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center text-[10px] text-white font-bold">
                        {challenge.rating}
                    </div>
                    <div>
                        <div className="text-sm text-white font-mono">{challenge.host}</div>
                        <div className="text-[10px] text-gray-500">Rapid 10+0</div>
                    </div>
                  </div>
                  
                  <div className="col-span-3 flex justify-center">
                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded border border-yellow-500/20 text-yellow-400 font-mono text-sm font-bold">
                        <Trophy size={12} />
                        {challenge.stake}
                    </div>
                  </div>

                  <div className="col-span-4 flex justify-end">
                    <button 
                        onClick={() => onStartGame(selectedGame, challenge.stake)}
                        className="flex items-center gap-2 bg-[#252830] hover:bg-green-600 hover:text-white text-gray-300 px-4 py-1.5 rounded text-xs font-bold transition-all border border-white/10 hover:border-green-500"
                    >
                        <Play size={12} fill="currentColor" />
                        PLAY
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </Modal>
  );
}
