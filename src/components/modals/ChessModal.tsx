import { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Modal } from '../ui/Modal';
import { useSession } from '../../context/SessionContext';
import { useGameSigner } from '../../hooks/useGameSigner';
import { ScrollText, Trophy, Clock, Flag, RotateCcw, User } from 'lucide-react';

interface ChessModalProps {
  isOpen: boolean;
  onClose: () => void;
  stake?: number;
  gameId?: string;
}

export function ChessModal({ isOpen, onClose, stake = 10, gameId = 'demo-game' }: ChessModalProps) {
  const { addLog, logs } = useSession();
  const { signMove } = useGameSigner();
  const [game, setGame] = useState(new Chess());
  const [gameStatus, setGameStatus] = useState<'SETUP' | 'PLAYING' | 'FINISHED'>('SETUP');
  const [nonce, setNonce] = useState(0);
  const [whiteTimer, setWhiteTimer] = useState(600); // 10 mins
  const [blackTimer, setBlackTimer] = useState(600);
  
  // Fake timer logic
  useEffect(() => {
    let interval: any;
    if (gameStatus === 'PLAYING') {
      interval = setInterval(() => {
        if (game.turn() === 'w') {
            setWhiteTimer(t => t > 0 ? t - 1 : 0);
        } else {
            setBlackTimer(t => t > 0 ? t - 1 : 0);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStatus, game]);

  // Reset game when opening
  useEffect(() => {
    if(isOpen) {
        setGame(new Chess());
        setGameStatus('PLAYING'); // Auto-start if stake passes
        setWhiteTimer(600);
        setBlackTimer(600);
    }
  }, [isOpen]);

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function makeComputerMove() {
    safeGameMutate((g) => {
      const possibleMoves = g.moves({ verbose: true });
      if (g.isGameOver() || g.isDraw() || possibleMoves.length === 0) {
          setGameStatus('FINISHED');
          return;
      }
      
      // Simple AI: Capture high value pieces if possible
      let bestMove = possibleMoves[0];
      let maxScore = -100;
      
      const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
      
      // Shuffle moves to add variety to equal moves
      possibleMoves.sort(() => Math.random() - 0.5);

      for(const move of possibleMoves) {
          let score = 0;
          if (move.captured && move.captured in pieceValues) {
              score += pieceValues[move.captured] * 10;
          }
           if (move.promotion) {
              score += 90;
          }
          // Prioritize checks slightly
          if (move.san.includes('+')) score += 2;
          
          if (score > maxScore) {
              maxScore = score;
              bestMove = move;
          }
      }

      g.move(bestMove.san);
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
    if (gameStatus !== 'PLAYING') {
        console.warn('Game not playing:', gameStatus);
        return false;
    }

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
        console.warn('Invalid move:', e);
        return false;
    }

    if (!move) return false;

    // We update the board optimistically
    safeGameMutate((g) => {
        g.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    });
    
    // Async signature without state dependency to avoid closure staleness on 'nonce'
    // We fetch the current nonce if possible, or just increment local state
    const moveSan = move.san;

    signMove(gameId, moveSan, nonce).then(signature => {
        if(signature) {
             addLog(`MOVE: ${moveSan}`, 0.00, signature.slice(0, 10));
             setNonce(prev => prev + 1);
             // Simulate Reply
             setTimeout(makeComputerMove, 500 + Math.random() * 1000); 
        } else {
            console.error('Signature rejected');
            // Revert if rejected
            safeGameMutate(g => g.undo());
        }
    }).catch(err => {
        console.error('Sign error', err);
        safeGameMutate(g => g.undo());
    });

    return true;
  }

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="P2P Match Arena" 
        badge="LIVE CHANNEL"
        className="max-w-[1200px] transform-none"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">
        
        {/* LEFT: Game Info & Chat */}
        <div className="lg:col-span-3 flex flex-col gap-4">
             {/* Stake Card */}
             <div className="bg-[#15171e] p-4 rounded-xl border border-yellow-500/20 shadow-[0_0_20px_rgba(250,204,21,0.05)]">
                 <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Pot</div>
                 <div className="text-3xl font-mono font-bold text-yellow-400 flex items-center gap-2">
                     <Trophy size={24} className="text-yellow-600"/>
                     {(stake * 2).toFixed(2)}
                 </div>
                 <div className="text-[10px] text-gray-400 mt-2 flex justify-between">
                     <span>Your Stake: ${stake}</span>
                     <span>Fee: $0.00</span>
                 </div>
             </div>

             {/* Move History */}
             <div className="flex-1 bg-black/40 rounded-xl border border-white/5 p-3 overflow-hidden flex flex-col">
                 <div className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-2">
                     <ScrollText size={12}/> Move Log (On-Chain Proofs)
                 </div>
                 <div className="flex-1 overflow-y-auto space-y-1 font-mono text-xs custom-scrollbar">
                     {logs.filter(l => l.action.startsWith('MOVE')).map((log, i) => (
                         <div key={i} className="grid grid-cols-12 gap-2 text-gray-400 border-b border-white/5 py-1">
                             <span className="col-span-1 text-gray-600">{i+1}.</span>
                             <span className="col-span-3 text-white">{log.action.replace('MOVE: ', '')}</span>
                             <span className="col-span-8 text-[10px] truncate text-green-700">{log.hash}</span>
                         </div>
                     ))}
                 </div>
             </div>
        </div>

        {/* CENTER: Board */}
        <div className="lg:col-span-6 flex flex-col justify-center items-center relative">
            
            {/* Opponent Info */}
            <div className="w-full flex justify-between items-center mb-4 px-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gray-800 border border-white/10 flex items-center justify-center">
                        <User size={20} className="text-gray-500"/>
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white">Guest_Opponent</div>
                        <div className="text-xs text-gray-500">Rating: 1450</div>
                    </div>
                </div>
                <div className={`flex items-center gap-2 bg-[#1a1d24] px-3 py-1.5 rounded-md border ${game.turn() === 'b' ? 'border-yellow-500 text-white' : 'border-white/5 text-gray-500'}`}>
                    <Clock size={16}/>
                    <span className="font-mono text-xl">{formatTime(blackTimer)}</span>
                </div>
            </div>

            {/* The Board */}
            <div className="border-[8px] border-[#262421] rounded-sm shadow-2xl w-full max-w-[500px] aspect-square">
                {/* Casting props to any to avoid strict type issues with react-chessboard versions */}
                <Chessboard 
                    id="BasicBoard" 
                    arePiecesDraggable={true}
                    {...({
                        position: game.fen(),
                        onPieceDrop: onDrop,
                        boardOrientation: "white",
                        customDarkSquareStyle: { backgroundColor: '#779954' },
                        customLightSquareStyle: { backgroundColor: '#e9edcc' }
                    } as any)}
                />
            </div>

            {/* My Info */}
             <div className="w-full flex justify-between items-center mt-4 px-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-yellow-500/10 border border-yellow-500/50 flex items-center justify-center">
                        <User size={20} className="text-yellow-500"/>
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white">You</div>
                        <div className="text-xs text-gray-500">Rating: 1500</div>
                    </div>
                </div>
                <div className={`flex items-center gap-2 bg-[#1a1d24] px-3 py-1.5 rounded-md border ${game.turn() === 'w' ? 'border-yellow-500 text-white' : 'border-white/5 text-gray-500'}`}>
                    <Clock size={16}/>
                    <span className="font-mono text-xl">{formatTime(whiteTimer)}</span>
                </div>
            </div>
        </div>

        {/* RIGHT: Actions */}
        <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="bg-[#15171e] p-4 rounded-xl border border-white/10 h-full flex flex-col">
                <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Game Actions</h4>
                
                <div className="space-y-3">
                    <button className="w-full flex items-center justify-between p-3 bg-red-900/20 hover:bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 transition-colors">
                        <span className="text-sm font-bold">Resign</span>
                        <Flag size={18}/>
                    </button>
                    
                    <button className="w-full flex items-center justify-between p-3 bg-blue-900/20 hover:bg-blue-900/30 border border-blue-500/30 rounded-lg text-blue-400 transition-colors">
                        <span className="text-sm font-bold">Offer Draw</span>
                        <RotateCcw size={18}/>
                    </button>
                </div>

                <div className="mt-auto pt-6 border-t border-white/5">
                    <div className="text-xs text-gray-500 text-center">
                        State Channel #8392<br/>
                        Verified by Yellow Network
                    </div>
                </div>
            </div>
        </div>

      </div>
    </Modal>
  );
}
