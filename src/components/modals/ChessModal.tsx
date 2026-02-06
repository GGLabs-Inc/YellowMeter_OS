import { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Modal } from '../ui/Modal';
import { useSession } from '../../context/SessionContext';
import { useGameSigner } from '../../hooks/useGameSigner';
import { ScrollText } from 'lucide-react';

interface ChessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChessModal({ isOpen, onClose }: ChessModalProps) {
  const { addLog, logs, balance } = useSession();
  const { signMove } = useGameSigner();
  const [game, setGame] = useState(new Chess());
  const [gameStatus, setGameStatus] = useState<'SETUP' | 'PLAYING'>('SETUP');
  // Temporary nonce tracker
  const [nonce, setNonce] = useState(0);
  
  // Reset game when opening
  useEffect(() => {
    if(isOpen) {
        setGame(new Chess());
        setGameStatus('SETUP');
    }
  }, [isOpen]);

  function makeRandomMove() {
    safeGameMutate((g) => {
      const possibleMoves = g.moves();
      if (g.isGameOver() || g.isDraw() || possibleMoves.length === 0) return;
      const randomIndex = Math.floor(Math.random() * possibleMoves.length);
      g.move(possibleMoves[randomIndex]);
    });
  }

  function safeGameMutate(modify: (g: Chess) => void) {
    setGame((g) => {
      const update = new Chess(g.fen());
      modify(update);
      return update;
    });
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    if (gameStatus !== 'PLAYING') return false;

    // Check validity on a temporary copy first to return boolean synchronously
    const gameCopy = new Chess(game.fen());
    let move = null;
    try {
        move = gameCopy.move({
            from: sourceSquare,
            to: targetSquare,
            promotion: 'q',
        });
    } catch (e) {
        return false;
    }

    if (!move) return false;

    // Async signature
    const currentNonce = nonce;
    // We update the board optimistically
    safeGameMutate((g) => {
        g.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    });

    signMove("demo-game-id", move.san, currentNonce).then(signature => {
        if(signature) {
             addLog(`MOVE: ${move.san}`, 0.00, signature.slice(0, 10) + '...');
             setNonce(prev => prev + 1);
             // Simulate Reply
             setTimeout(makeRandomMove, 500);
        } else {
            // Revert if rejected
            safeGameMutate(g => g.undo());
        }
    });

    return true;
  }

  const handleStartGame = () => {
    setGameStatus('PLAYING');
    addLog('GAME_START: Wager 10 USDC', 0.00);
  };

  const handleRandomMoveClick = () => {
    // User force move for demo
    const possibleMoves = game.moves();
    if(possibleMoves.length === 0) return;
    const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

    safeGameMutate((g) => {
        g.move(randomMove);
    });
    
    signMove("demo-game-id", randomMove, nonce).then(signature => {
        if(signature) {
             addLog(`MOVE: ${randomMove}`, 0.00, signature.slice(0, 10) + '...');
             setNonce(prev => prev + 1);
             setTimeout(makeRandomMove, 500);
        } else {
             safeGameMutate(g => g.undo());
        }
    });
  };

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="P2P Chess Channel" 
        badge={gameStatus === 'SETUP' ? 'SETUP' : 'LIVE'}
        className="max-w-4xl"
    >
      
      {gameStatus === 'SETUP' ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Configurar Partida</h3>
            <p className="text-gray-400 mb-8">Deposita en el canal de estado para iniciar.</p>

            <div className="bg-[#0a0c10] border border-yellow-500/30 p-8 rounded-xl flex flex-col items-center gap-4 w-72 shadow-[0_0_40px_rgba(250,204,21,0.1)]">
                <span className="text-gray-400 text-sm">Apuesta (Wager)</span>
                <span className="text-3xl font-bold text-white">10.00 USDC</span>
                <button 
                    onClick={handleStartGame}
                    className="w-full mt-4 bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                >
                    Block Funds & Start
                </button>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Board */}
            <div>
                <div className="flex justify-between items-center mb-4 text-sm font-mono">
                    <span className="text-white font-bold">Opponent: <span className="text-gray-400">GrandMaster_AI</span></span>
                    <span className="text-yellow-500">10:00</span>
                </div>
                

                <div className="border-4 border-[#262421] rounded-lg overflow-hidden shadow-2xl">
                    <Chessboard 
                        id="BasicBoard"
                        {...({
                            position: game.fen(),
                            onPieceDrop: onDrop,
                            customDarkSquareStyle: { backgroundColor: '#779954' },
                            customLightSquareStyle: { backgroundColor: '#e9edcc' }
                        } as any)}
                    />
                </div>

                <button 
                    onClick={handleRandomMoveClick}
                    className="w-full mt-4 bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                >
                   Hacer Movimiento (Off-chain)
                </button>
            </div>

            {/* Right: Logs */}
            <div className="flex flex-col h-full min-h-[400px]">
                <div className="flex items-center gap-2 mb-4 text-gray-400 border-b border-white/10 pb-2">
                    <ScrollText size={16} />
                    <span className="font-bold text-sm">State Channel Log</span>
                </div>
                
                <div className="flex-grow bg-black/40 rounded-lg p-4 font-mono text-xs overflow-y-auto space-y-3 h-[400px]">
                 {logs.length === 0 && (
                     <span className="text-gray-600">← Inicia la partida para abrir el canal.</span>
                 )}
                 {logs.map((log, i) => (
                     <div key={i} className="border-b border-white/5 pb-2 last:border-0 animate-in fade-in slide-in-from-right-4 duration-300">
                         <div className="flex justify-between text-yellow-400 mb-1">
                             <span className="font-bold text-white">{log.action}</span>
                             <span>{log.cost.toFixed(2)} USDC (Signed)</span>
                         </div>
                         <div className="text-gray-600 truncate">
                             Sig: {log.hash}
                         </div>
                     </div>
                 ))}
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-end">
                    <span className="text-gray-500 text-xs">Channel Balance:</span>
                    <span className="text-white font-mono font-bold">{balance.toFixed(2)} USDC</span>
                </div>
            </div>
        </div>
      )}

    </Modal>
  );
}
