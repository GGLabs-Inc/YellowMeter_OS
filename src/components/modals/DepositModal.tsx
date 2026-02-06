import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useSession } from '../../context/SessionContext';
import { Info, Lock } from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const { openChannel } = useSession();
  const [amount, setAmount] = useState('100.00');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDeposit = async () => {
    setIsProcessing(true);
    
    // Simulate wallet signature and blockchain delay
    setTimeout(() => {
        openChannel(parseFloat(amount));
        setIsProcessing(false);
        onClose();
    }, 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="1. Depositar Fondos">
      
      {/* Info Box */}
      <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <Info className="text-green-500 shrink-0 mt-0.5" size={20} />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-green-400">¿Qué está pasando aquí?</h4>
            <p className="text-xs text-green-200/70 leading-relaxed">
              Vas a interactuar con el Smart Contract <span className="text-white font-medium">SessionSafe</span>. 
              Depositarás tokens USDC que quedarán custodiados en la blockchain. 
              Esto crea el "colateral" para abrir un <span className="text-white font-medium">canal de estado (State Channel)</span> seguro con Yellow Network.
            </p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="space-y-4 mb-6">
        <label className="block text-sm font-medium text-gray-400">
          Monto a Custodiar (MUSDC)
        </label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isProcessing}
            className="w-full bg-[#1a1d24] border border-white/10 rounded-lg py-4 px-4 text-2xl font-mono text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all"
            placeholder="0.00"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold bg-white/10 px-2 py-1 rounded text-gray-400">
            MUSDC
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleDeposit}
        disabled={isProcessing}
        className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-yellow-400/50 disabled:cursor-not-allowed text-black font-bold py-4 rounded-lg text-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(250,204,21,0.3)] hover:shadow-[0_0_30px_rgba(250,204,21,0.5)]"
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            <span>Firmando...</span>
          </>
        ) : (
          <>
            <Lock size={20} />
            <span>Firmar & Depositar</span>
          </>
        )}
      </button>
      
      <p className="text-center text-xs text-gray-500 mt-4">
        Esta acción cuesta gas y requiere confirmación de bloque.
      </p>
    </Modal>
  );
}
