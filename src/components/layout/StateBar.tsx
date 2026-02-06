import { Zap } from 'lucide-react';
import { useSession } from '../../context/SessionContext';

interface StateBarProps {
  onSettle: () => void;
}

export function StateBar({ onSettle }: StateBarProps) {
  const { isChannelOpen, balance, actionsCount } = useSession();

  if (!isChannelOpen) return null;

  return (
    <div className="w-full max-w-6xl mx-auto mb-8 animate-in slide-in-from-top-4 duration-500">
      
      {/* 1. Green Alert Box */}
      <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-t-lg backdrop-blur-sm">
        <div className="flex items-center gap-2 text-green-400 mb-1">
            <Zap className="w-4 h-4 fill-green-400" />
            <span className="font-bold text-sm uppercase tracking-wider">Modo Off-Chain Activo</span>
        </div>
        <p className="text-green-200/60 text-sm">
            Ahora estás operando en un canal de Yellow Network. <span className="text-white font-medium">Cero gas. Velocidad instantánea.</span> Cada clic firma un mensaje criptográfico que actualiza tu balance localmente.
        </p>
      </div>

      {/* 2. Stats Row */}
      <div className="bg-[#0f1115] border-x border-b border-border p-6 rounded-b-lg flex flex-col md:flex-row justify-between items-center gap-6">
        
        <div className="flex gap-12 w-full md:w-auto">
            <div>
                <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">
                    BALANCE EN TIEMPO REAL
                </span>
                <span className="text-2xl font-mono font-bold text-white tracking-tight">
                    {balance.toFixed(4)} <span className="text-sm font-sans text-gray-400">USDC</span>
                </span>
            </div>

            <div>
                <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">
                    ACCIONES FIRMADAS
                </span>
                <span className="text-2xl font-mono font-bold text-white tracking-tight">
                    #{actionsCount}
                </span>
            </div>
        </div>

        <button
            onClick={onSettle}
            className="w-full md:w-auto px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 rounded-lg font-bold text-sm transition-all"
        >
            Cerrar Sesión & Liquidar
        </button>

      </div>
    </div>
  );
}
