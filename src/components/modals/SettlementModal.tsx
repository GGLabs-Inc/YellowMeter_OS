import { Modal } from '../ui/Modal';
import { useSession } from '../../context/SessionContext';
import { CheckCircle, ExternalLink } from 'lucide-react';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettlementModal({ isOpen, onClose }: SettlementModalProps) {
  const { initialDeposit, balance } = useSession();
  const spent = initialDeposit - balance;

  const handleRestart = () => {
    onClose();
    window.location.reload(); // Simple reset for demo
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="Liquidación Final (Settlement)">
      
      {/* Success Banner */}
      <div className="bg-green-900/10 border border-green-500/20 rounded-lg p-4 mb-6">
        <p className="text-sm text-green-200/80 leading-relaxed">
          Hemos cerrado el canal. El backend envió la prueba criptográfica del estado final al contrato <span className="text-white font-bold">SessionSafe</span>.
          La blockchain verificó las firmas y distribuyó los fondos: pagó al proveedor y te devolvió el cambio. <span className="text-white font-bold">Todo en 1 sola transacción.</span>
        </p>
      </div>

      <div className="flex justify-center mb-6">
        <div className="bg-green-500/10 p-4 rounded-full">
            <CheckCircle className="text-green-500 w-12 h-12" />
        </div>
      </div>

      <h3 className="text-center text-2xl font-bold text-white mb-8">Sesión Finalizada</h3>

      {/* Stats Card */}
      <div className="bg-[#0a0c10] rounded-lg p-6 mb-8 border border-white/5 space-y-4">
        <div className="flex justify-between items-center text-gray-400">
            <span>Depósito:</span>
            <span className="font-mono text-white">{initialDeposit.toFixed(2)} MUSDC</span>
        </div>
        <div className="flex justify-between items-center text-gray-400">
            <span>Gastado:</span>
            <span className="font-mono text-red-500">- {spent.toFixed(4)}</span>
        </div>
        <div className="h-px bg-white/10 my-2" />
        <div className="flex justify-between items-center text-lg font-bold">
            <span className="text-white">Reembolso:</span>
            <span className="font-mono text-green-500">{balance.toFixed(4)} MUSDC</span>
        </div>
      </div>

      {/* Etherscan Link */}
      <div className="text-center mb-6">
        <a href="#" className="text-blue-500 hover:text-blue-400 text-sm flex items-center justify-center gap-1">
            Ver en Etherscan (Sepolia) <ExternalLink size={14} />
        </a>
      </div>

      {/* Restart Button */}
      <button
        onClick={handleRestart}
        className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 rounded-lg shadow-[0_0_20px_rgba(250,204,21,0.2)]"
      >
        Reiniciar Demo
      </button>

    </Modal>
  );
}
