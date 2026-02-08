import { useState, useEffect, useMemo } from 'react';
import { Chess } from 'chess.js';
import type { Move, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Modal } from '../ui/Modal';
import { useSession } from '../../context/SessionContext';
import { useGameSigner } from '../../hooks/useGameSigner';
import { ScrollText, Trophy, Clock, Flag, RotateCcw, User, Users } from 'lucide-react';

interface ChessModalProps {
  isOpen: boolean;
  onClose: () => void;
  stake?: number;
  gameId?: string;
}

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
  const [timeControl, setTimeControl] = useState(TIME_CONTROLS[4]); // Default 10+0
  const [whiteTimer, setWhiteTimer] = useState(timeControl.time);
  const [blackTimer, setBlackTimer] = useState(timeControl.time);
  const [boardKey, setBoardKey] = useState(0);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Move[]>([]);

  // Calculate custom square styles for highlighting possible moves
  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    
    // Highlight selected square
    if (selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: 'rgba(255, 255, 0, 0.5)',
        boxShadow: 'inset 0 0 0 4px rgba(255, 255, 0, 0.8)',
      };
    }
    
    // Highlight possible moves
    possibleMoves.forEach((move) => {
      if (move.captured) {
        // Red for captures
        styles[move.to] = {
          backgroundColor: 'rgba(255, 0, 0, 0.5)',
          boxShadow: 'inset 0 0 0 4px rgba(255, 0, 0, 0.8)',
        };
      } else {
        // Yellow for normal moves
        styles[move.to] = {
          backgroundColor: 'rgba(255, 255, 0, 0.4)',
          borderRadius: '50%',
          boxShadow: 'inset 0 0 10px rgba(255, 255, 0, 0.6)',
        };
      }
    });
    
    return styles;
  }, [selectedSquare, possibleMoves]);

  // Handle square click to show possible moves
  function onSquareClick(square: Square) {
    if (gameStatus !== 'PLAYING') return;
    
    const piece = game.get(square);
    
    // If clicking on a piece of the current player's color
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setPossibleMoves(moves);
    } else if (selectedSquare) {
      // Try to make a move if a piece is already selected
      const moveAttempt = possibleMoves.find(m => m.to === square);
      if (moveAttempt) {
        makeMove(selectedSquare, square);
      }
      // Clear selection
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  }

  function makeMove(sourceSquare: string, targetSquare: string): boolean {
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
    
    // Clear selection
    setSelectedSquare(null);
    setPossibleMoves([]);

    const moveSan = moveResult.san;
    const playerColor = moveResult.color === 'w' ? 'White' : 'Black';

    // Add increment after move
    if (moveResult.color === 'w') {
      setWhiteTimer(t => t + timeControl.increment);
    } else {
      setBlackTimer(t => t + timeControl.increment);
    }

    // Check if game is over
    if (game.isGameOver() || game.isDraw()) {
      setGameStatus('FINISHED');
    }

    // Try to sign move in background
    signMove(gameId, moveSan, nonce).then(signature => {
      if(signature) {
        addLog(`${playerColor}: ${moveSan}`, 0.00, signature.slice(0, 10));
        setNonce(prev => prev + 1);
      } else {
        addLog(`${playerColor}: ${moveSan}`, 0.00, 'local');
      }
    }).catch(err => {
      console.warn('Could not sign move (playing locally):', err);
      addLog(`${playerColor}: ${moveSan}`, 0.00, 'local');
    });

    return true;
  }

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
        setSelectedSquare(null);
        setPossibleMoves([]);
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
    setSelectedSquare(null);
    setPossibleMoves([]);
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

    // Clear any existing selection
    setSelectedSquare(null);
    setPossibleMoves([]);

    return makeMove(sourceSquare, targetSquare);
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
            {/* Game Mode Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="text-yellow-500" size={20}/>
                Mode: 2 Players Local
              </h3>
              <div className="bg-[#15171e] p-6 rounded-xl border border-white/10">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                    <div className="h-12 w-12 rounded-lg bg-white border-2 border-yellow-500/50 flex items-center justify-center">
                      <User size={24} className="text-gray-800"/>
                    </div>
                    <div>
                      <div className="font-bold text-white">Player 1 - White</div>
                      <div className="text-xs text-gray-400">Moves first</div>
                    </div>
                  </div>
                  <div className="text-center text-gray-500 text-sm">VS</div>
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                    <div className="h-12 w-12 rounded-lg bg-gray-800 border-2 border-gray-500/50 flex items-center justify-center">
                      <User size={24} className="text-white"/>
                    </div>
                    <div>
                      <div className="font-bold text-white">Player 2 - Black</div>
                      <div className="text-xs text-gray-400">Moves second</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="text-xs text-yellow-400">
                    <strong>Tip:</strong> Click on a piece to see possible moves. 
                    Yellow = valid move, Red = capture.
                  </div>
                </div>
              </div>
            </div>

            {/* Time Control Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="text-blue-500" size={20}/>
                Time Control
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
                          {Math.floor(tc.time / 60)} minutes{tc.increment > 0 ? ` + ${tc.increment}s increment` : ''}
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
                  Start Game
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
                     {logs.filter(l => l.action.startsWith('Blancas:') || l.action.startsWith('Negras:')).map((log, i) => (
                         <div key={i} className="grid grid-cols-12 gap-2 text-gray-400 border-b border-white/5 py-1">
                             <span className="col-span-1 text-gray-600">{i+1}.</span>
                             <span className={`col-span-4 ${log.action.startsWith('Blancas') ? 'text-white' : 'text-gray-300'}`}>
                               {log.action}
                             </span>
                             <span className="col-span-7 text-[10px] truncate text-green-700">{log.hash}</span>
                         </div>
                     ))}
                 </div>
             </div>
        </div>

        {/* CENTER: Board */}
        <div className="lg:col-span-6 flex flex-col justify-center items-center relative">
            
            {/* Player 2 (Black) Info */}
            <div className="w-full flex justify-between items-center mb-4 px-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gray-800 border border-white/10 flex items-center justify-center">
                        <User size={20} className="text-white"/>
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white">Player 2 - Black</div>
                        <div className="text-xs text-gray-500">{game.turn() === 'b' ? '⚡ Your turn' : 'Waiting...'}</div>
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
                        onSquareClick: ({ square }) => onSquareClick(square as Square),
                        boardOrientation: "white",
                        darkSquareStyle: { backgroundColor: '#779954' },
                        lightSquareStyle: { backgroundColor: '#e9edcc' },
                        allowDragging: gameStatus === 'PLAYING',
                        squareStyles: customSquareStyles
                    }}
                />
            </div>

            {/* Player 1 (White) Info */}
             <div className="w-full flex justify-between items-center mt-4 px-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-yellow-500/10 border border-yellow-500/50 flex items-center justify-center">
                        <User size={20} className="text-yellow-500"/>
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white">Player 1 - White</div>
                        <div className="text-xs text-gray-500">{game.turn() === 'w' ? '⚡ Your turn' : 'Waiting...'}</div>
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
                <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Game Information</h4>
                
                <div className="space-y-3 mb-4">
                  <div className="p-3 bg-black/40 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Time Control</div>
                    <div className="text-sm font-bold text-white">{timeControl.label}</div>
                  </div>
                  
                  <div className="p-3 bg-black/40 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Game Mode</div>
                    <div className="text-sm font-bold text-yellow-400">2 Players Local</div>
                    <div className="text-xs text-gray-500">Turn: {game.turn() === 'w' ? 'White' : 'Black'}</div>
                  </div>

                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="text-xs text-blue-400">
                      <strong>Help:</strong> Click on a piece to see its moves. 
                      <span className="text-yellow-400"> Yellow</span> = move, 
                      <span className="text-red-400"> Red</span> = capture.
                    </div>
                  </div>

                  {gameStatus === 'FINISHED' && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <div className="text-sm font-bold text-yellow-400 text-center">
                        {whiteTimer <= 0 ? 'Timeout! Black wins' :
                         blackTimer <= 0 ? 'Timeout! White wins' :
                         game.isCheckmate() ? `Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins` :
                         game.isDraw() ? 'Draw!' : 'Game Over'}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                    <button 
                      onClick={() => setGameStatus('FINISHED')}
                      className="w-full flex items-center justify-between p-3 bg-red-900/20 hover:bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 transition-colors"
                    >
                        <span className="text-sm font-bold">Resign</span>
                        <Flag size={18}/>
                    </button>
                    
                    <button 
                      onClick={startGame}
                      className="w-full flex items-center justify-between p-3 bg-blue-900/20 hover:bg-blue-900/30 border border-blue-500/30 rounded-lg text-blue-400 transition-colors"
                    >
                        <span className="text-sm font-bold">New Game</span>
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
