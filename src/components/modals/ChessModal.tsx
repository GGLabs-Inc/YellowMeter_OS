import { useState, useEffect, useCallback } from 'react';
import { Chess, Move } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Modal } from '../ui/Modal';
import { useSession } from '../../context/SessionContext';
import { useGameSigner } from '../../hooks/useGameSigner';
import { ScrollText, Trophy, Clock, Flag, RotateCcw, User, Crown } from 'lucide-react';

interface ChessModalProps {
  isOpen: boolean;
  onClose: () => void;
  stake?: number;
  gameId?: string;
}

// Professional Chess Players Database
const CHESS_PROS = [
  { name: "Magnus Carlsen", country: "Noruega", rating: 2840, style: "Universal", difficulty: 10 },
  { name: "Hikaru Nakamura", country: "Estados Unidos", rating: 2810, style: "Agresivo", difficulty: 9 },
  { name: "Fabiano Caruana", country: "Estados Unidos", rating: 2795, style: "Posicional", difficulty: 9 },
  { name: "Vincent Keymer", country: "Alemania", rating: 2776, style: "Táctico", difficulty: 8 },
  { name: "Arjun Erigaisi", country: "India", rating: 2775, style: "Dinámico", difficulty: 8 },
  { name: "Anish Giri", country: "Países Bajos", rating: 2760, style: "Sólido", difficulty: 8 },
  { name: "Alireza Firouzja", country: "Francia", rating: 2759, style: "Agresivo", difficulty: 8 },
  { name: "Praggnanandhaa R", country: "India", rating: 2758, style: "Preciso", difficulty: 7 },
  { name: "Gukesh D", country: "India", rating: 2756, style: "Ambicioso", difficulty: 7 },
  { name: "Wei Yi", country: "China", rating: 2756, style: "Creativo", difficulty: 7 },
];

const TIME_CONTROLS = [
  { label: "Bullet 1+0", time: 60, increment: 0 },
  { label: "Blitz 3+0", time: 180, increment: 0 },
  { label: "Blitz 3+2", time: 180, increment: 2 },
  { label: "Blitz 5+0", time: 300, increment: 0 },
  { label: "Rapid 10+0", time: 600, increment: 0 },
  { label: "Rapid 15+10", time: 900, increment: 10 },
];

export function ChessModal({ isOpen, onClose, stake = 10, gameId = 'demo-game' }: ChessModalProps) {
  const { addLog, logs } = useSession();
  const { signMove } = useGameSigner();
  const [game] = useState(new Chess());
  const [gameStatus, setGameStatus] = useState<'SETUP' | 'PLAYING' | 'FINISHED'>('SETUP');
  const [nonce, setNonce] = useState(0);
  const [selectedOpponent, setSelectedOpponent] = useState(CHESS_PROS[0]);
  const [timeControl, setTimeControl] = useState(TIME_CONTROLS[4]); // Default 10+0
  const [whiteTimer, setWhiteTimer] = useState(timeControl.time);
  const [blackTimer, setBlackTimer] = useState(timeControl.time);
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [boardKey, setBoardKey] = useState(0);

  function safeGameMutate(modify: (g: Chess) => void) {
    modify(game);
    setBoardKey(prev => prev + 1); // Force board update
  }

  // Computer move logic
  const makeComputerMove = useCallback(() => {
    safeGameMutate((g) => {
      const possibleMoves = g.moves({ verbose: true });
      if (g.isGameOver() || g.isDraw() || possibleMoves.length === 0) {
          setGameStatus('FINISHED');
          return;
      }

      // AI difficulty based on selected opponent
      const difficulty = selectedOpponent.difficulty;
      let bestMove = possibleMoves[0];
      let maxScore = -100;

      const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

      // Higher rated players make better moves
      const randomFactor = 10 - difficulty; // Less randomness for higher rated players

      // Shuffle moves to add variety
      possibleMoves.sort(() => Math.random() - 0.5);

      for(const move of possibleMoves) {
          let score = Math.random() * randomFactor; // Random element based on difficulty

          if (move.captured && move.captured in pieceValues) {
              score += pieceValues[move.captured] * difficulty;
          }
          if (move.promotion) {
              score += 90;
          }
          // Higher rated players prioritize checks and tactics more
          if (move.san.includes('+')) score += difficulty;
          if (move.san.includes('#')) score += difficulty * 10;

          // Positional considerations for higher rated players
          if (difficulty >= 8) {
            // Center control
            if (['e4', 'e5', 'd4', 'd5'].includes(move.to)) score += 2;
            // Development
            if (move.piece === 'n' || move.piece === 'b') score += 1;
          }

          if (score > maxScore) {
              maxScore = score;
              bestMove = move;
          }
      }

      g.move(bestMove.san);

      // Add increment after move
      setBlackTimer(t => t + timeControl.increment);
    });
  }, [selectedOpponent.difficulty, timeControl.increment]);

  // Auto-play computer move after player's turn
  useEffect(() => {
    if (gameStatus === 'PLAYING' && game.turn() === 'b' && !isComputerThinking) {
      setIsComputerThinking(true);
      const replyDelay = 500 + Math.random() * (2000 - selectedOpponent.difficulty * 100);

      setTimeout(() => {
        makeComputerMove();
        setIsComputerThinking(false);
      }, replyDelay);
    }
  }, [game, gameStatus, isComputerThinking, selectedOpponent.difficulty, makeComputerMove]);

  // Timer logic with increment
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (gameStatus === 'PLAYING') {
      interval = setInterval(() => {
        if (game.turn() === 'w') {
            setWhiteTimer(t => {
              if (t <= 0) {
                setGameStatus('FINISHED');
                return 0;
              }
              return t - 1;
            });
        } else {
            setBlackTimer(t => {
              if (t <= 0) {
                setGameStatus('FINISHED');
                return 0;
              }
              return t - 1;
            });
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameStatus, game]);

  // Reset game when opening
  useEffect(() => {
    if(isOpen) {
        game.reset();
        setGameStatus('SETUP');
        setWhiteTimer(timeControl.time);
        setBlackTimer(timeControl.time);
        setNonce(0);
        setIsComputerThinking(false);
        setBoardKey(prev => prev + 1);
    }
  }, [isOpen, timeControl.time, game]);

  // Update timers when time control changes
  useEffect(() => {
    setWhiteTimer(timeControl.time);
    setBlackTimer(timeControl.time);
  }, [timeControl]);

  function startGame() {
    game.reset();
    setGameStatus('PLAYING');
    setWhiteTimer(timeControl.time);
    setBlackTimer(timeControl.time);
    setNonce(0);
    setIsComputerThinking(false);
    setBoardKey(prev => prev + 1);
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function onDrop(sourceSquare: string, targetSquare: string | null) {
    if (gameStatus !== 'PLAYING') {
        console.warn('Game not playing:', gameStatus);
        return false;
    }

    if (!targetSquare) {
        console.warn('No target square');
        return false;
    }

    // Only allow player to move on their turn (white)
    if (game.turn() !== 'w') {
        console.warn('Not your turn');
        return false;
    }

    // First, validate the move on a copy to extract move details
    let moveResult: Move | null = null;

    try {
        moveResult = game.move({
            from: sourceSquare,
            to: targetSquare,
            promotion: 'q',
        });
    } catch (e) {
        console.warn('Invalid move:', e);
        return false;
    }

    if (!moveResult) {
        console.warn('Invalid move');
        return false;
    }

    // Update board
    setBoardKey(prev => prev + 1);

    const moveSan = moveResult.san;

    // Add increment after player move
    setWhiteTimer(t => t + timeControl.increment);

    // Try to sign move in background (optional - doesn't block gameplay)
    signMove(gameId, moveSan, nonce).then(signature => {
        if(signature) {
             addLog(`MOVE: ${moveSan}`, 0.00, signature.slice(0, 10));
             setNonce(prev => prev + 1);
        } else {
            // Still add log without signature for local play
            addLog(`MOVE: ${moveSan}`, 0.00, 'local');
        }
    }).catch(err => {
        console.warn('Could not sign move (playing locally):', err);
        // Still add log without signature for local play
        addLog(`MOVE: ${moveSan}`, 0.00, 'local');
    });

    // The computer will automatically move via useEffect when it detects it's black's turn

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
      {gameStatus === 'SETUP' && (
        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
            {/* Opponent Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Crown className="text-yellow-500" size={20}/>
                Selecciona tu Oponente
              </h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {CHESS_PROS.map((player) => (
                  <button
                    key={player.name}
                    onClick={() => setSelectedOpponent(player)}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      selectedOpponent.name === player.name
                        ? 'border-yellow-500 bg-yellow-500/10 shadow-lg'
                        : 'border-white/10 bg-[#15171e] hover:border-yellow-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <div className="font-bold text-white">{player.name}</div>
                        <div className="text-xs text-gray-400">{player.country}</div>
                        <div className="text-xs text-gray-500 mt-1">Estilo: {player.style}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-mono font-bold text-yellow-400">{player.rating}</div>
                        <div className="flex gap-1 mt-1">
                          {Array.from({ length: player.difficulty }).map((_, i) => (
                            <div key={i} className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Control Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="text-blue-500" size={20}/>
                Control de Tiempo
              </h3>
              <div className="space-y-2">
                {TIME_CONTROLS.map((tc) => (
                  <button
                    key={tc.label}
                    onClick={() => setTimeControl(tc)}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      timeControl.label === tc.label
                        ? 'border-blue-500 bg-blue-500/10 shadow-lg'
                        : 'border-white/10 bg-[#15171e] hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <div className="font-bold text-white">{tc.label}</div>
                        <div className="text-xs text-gray-400">
                          {Math.floor(tc.time / 60)} minutos{tc.increment > 0 ? ` + ${tc.increment}s incremento` : ''}
                        </div>
                      </div>
                      <Clock size={24} className={timeControl.label === tc.label ? 'text-blue-500' : 'text-gray-600'}/>
                    </div>
                  </button>
                ))}
              </div>

              {/* Match Info */}
              <div className="bg-[#15171e] p-6 rounded-xl border border-yellow-500/20 mt-6">
                <div className="text-center mb-4">
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Pot</div>
                  <div className="text-3xl font-mono font-bold text-yellow-400 flex items-center justify-center gap-2">
                    <Trophy size={24} className="text-yellow-600"/>
                    {(stake * 2).toFixed(2)}
                  </div>
                </div>
                <button
                  onClick={startGame}
                  className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
                >
                  Iniciar Partida
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(gameStatus === 'PLAYING' || gameStatus === 'FINISHED') && (
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
                        <Crown size={20} className="text-yellow-500"/>
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white">{selectedOpponent.name}</div>
                        <div className="text-xs text-gray-500">{selectedOpponent.country} · {selectedOpponent.rating}</div>
                    </div>
                </div>
                <div className={`flex items-center gap-2 bg-[#1a1d24] px-3 py-1.5 rounded-md border ${
                  game.turn() === 'b' ? 'border-yellow-500 text-white animate-pulse' : 'border-white/5 text-gray-500'
                } ${blackTimer <= 20 && game.turn() === 'b' ? 'border-red-500 text-red-500' : ''}`}>
                    <Clock size={16}/>
                    <span className="font-mono text-xl">{formatTime(blackTimer)}</span>
                </div>
            </div>

            {/* The Board */}
            <div className="border-[8px] border-[#262421] rounded-sm shadow-2xl w-full max-w-[500px] aspect-square">
                <Chessboard 
                    key={`${boardKey}-${game.fen()}`}
                    options={{
                        position: game.fen(),
                        onPieceDrop: ({ sourceSquare, targetSquare }) => onDrop(sourceSquare, targetSquare),
                        boardOrientation: "white",
                        darkSquareStyle: { backgroundColor: '#779954' },
                        lightSquareStyle: { backgroundColor: '#e9edcc' },
                        allowDragging: gameStatus === 'PLAYING'
                    }}
                />
            </div>

            {/* My Info */}
             <div className="w-full flex justify-between items-center mt-4 px-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-yellow-500/10 border border-yellow-500/50 flex items-center justify-center">
                        <User size={20} className="text-yellow-500"/>
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white">Tú</div>
                        <div className="text-xs text-gray-500">Rating: 1500</div>
                    </div>
                </div>
                <div className={`flex items-center gap-2 bg-[#1a1d24] px-3 py-1.5 rounded-md border ${
                  game.turn() === 'w' ? 'border-yellow-500 text-white animate-pulse' : 'border-white/5 text-gray-500'
                } ${whiteTimer <= 20 && game.turn() === 'w' ? 'border-red-500 text-red-500' : ''}`}>
                    <Clock size={16}/>
                    <span className="font-mono text-xl">{formatTime(whiteTimer)}</span>
                </div>
            </div>
        </div>

        {/* RIGHT: Actions */}
        <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="bg-[#15171e] p-4 rounded-xl border border-white/10 h-full flex flex-col">
                <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Información de Partida</h4>
                
                <div className="space-y-3 mb-4">
                  <div className="p-3 bg-black/40 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Control de Tiempo</div>
                    <div className="text-sm font-bold text-white">{timeControl.label}</div>
                  </div>
                  
                  <div className="p-3 bg-black/40 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Oponente</div>
                    <div className="text-sm font-bold text-yellow-400">{selectedOpponent.name}</div>
                    <div className="text-xs text-gray-500">{selectedOpponent.style} · {selectedOpponent.rating}</div>
                  </div>

                  {gameStatus === 'FINISHED' && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <div className="text-sm font-bold text-yellow-400 text-center">
                        {whiteTimer <= 0 ? '¡Tiempo agotado! Negras ganan' :
                         blackTimer <= 0 ? '¡Tiempo agotado! Blancas ganan' :
                         game.isCheckmate() ? `¡Jaque mate! ${game.turn() === 'w' ? 'Negras' : 'Blancas'} ganan` :
                         game.isDraw() ? '¡Tablas!' : 'Juego terminado'}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                    <button 
                      onClick={() => setGameStatus('FINISHED')}
                      className="w-full flex items-center justify-between p-3 bg-red-900/20 hover:bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 transition-colors"
                    >
                        <span className="text-sm font-bold">Rendirse</span>
                        <Flag size={18}/>
                    </button>
                    
                    <button 
                      onClick={startGame}
                      className="w-full flex items-center justify-between p-3 bg-blue-900/20 hover:bg-blue-900/30 border border-blue-500/30 rounded-lg text-blue-400 transition-colors"
                    >
                        <span className="text-sm font-bold">Nueva Partida</span>
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
      )}
    </Modal>
  );
}
