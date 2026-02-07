import { useState } from 'react';
import { useWriteContract, usePublicClient } from 'wagmi';
import { parseAbi, parseUnits } from 'viem';
import { Modal } from '../ui/Modal';
import { useSession } from '../../context/SessionContext';
import { CheckCircle, ExternalLink, Loader2, ArrowRight } from 'lucide-react';
import { CONTRACTS } from '../../config/constants';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettlementModal({ isOpen, onClose }: SettlementModalProps) {
  const { initialDeposit, balance, closeChannel } = useSession();
  const spent = initialDeposit - balance;
  
  const [step, setStep] = useState<'idle' | 'processing' | 'success'>('idle');
  const [progress, setProgress] = useState(0);
  const [txHash, setTxHash] = useState<string>('');

  // Wagmi
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const handleSettle = async () => {
    setStep('processing');
    setProgress(10); // Inicio

    try {
        console.log("⚡ Settle Request...");
        
        // 1. Withdraw FULL amount from Adjudicator
        const fullAmountUnits = parseUnits(initialDeposit.toFixed(6), 6);
        
        console.log("1. Withdrawing Custody:", fullAmountUnits);
        setProgress(25); // Preparando retiro

        const hash1 = await writeContractAsync({
            address: CONTRACTS.Adjudicator as `0x${string}`,
            abi: parseAbi(['function withdraw(address token, uint256 amount)']),
            functionName: 'withdraw',
            args: [CONTRACTS.USDC as `0x${string}`, fullAmountUnits]
        });
        
        console.log("Tx Withdraw:", hash1);
        setProgress(50); // Esperando confirmación retiro
        
        await publicClient.waitForTransactionReceipt({ hash: hash1 });
        setProgress(65); // Retiro confirmado

        // 2. Pay Service Fee
        const feeAmount = initialDeposit - balance; 
        if (feeAmount > 0) {
             const feeUnits = parseUnits(feeAmount.toFixed(6), 6);
             console.log("2. Paying Service Fee:", feeUnits);
             setProgress(75); // Preparando pago fee

             const hash2 = await writeContractAsync({
                address: CONTRACTS.USDC as `0x${string}`,
                abi: parseAbi(['function transfer(address to, uint256 amount) returns (bool)']),
                functionName: 'transfer',
                args: [CONTRACTS.ServerWallet as `0x${string}`, feeUnits]
            });
            console.log("Tx Fee Payment:", hash2);
            setTxHash(hash2);
            setProgress(90); // Esperando confirmación pago
            
            await publicClient.waitForTransactionReceipt({ hash: hash2 });
        } else {
            setTxHash(hash1);
        }
        
        setProgress(100);
        setStep('success');
        
    } catch (e) {
        console.error("Settlement Failed", e);
        alert("Error en liquidación: " + (e as any).message);
        setStep('idle');
        setProgress(0);
    }
  };

  const handleRestart = () => {
    closeChannel(); // Clear session
    onClose();
    window.location.reload(); 
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="Liquidación Final (Settlement)">
      
      {step === 'success' ? (
        <>
            {/* Success Banner */}
            <div className="bg-green-900/10 border border-green-500/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-200/80 leading-relaxed">
                Hemos cerrado el canal. La tecnología de <span className="text-white font-bold">Yellow Network</span> verificó la prueba criptográfica del estado final y distribuyó los fondos: pagó al proveedor y te devolvió el cambio. <span className="text-white font-bold">Todo en 1 sola transacción.</span>
                </p>
            </div>

            <div className="flex justify-center mb-6">
                <div className="bg-green-500/10 p-4 rounded-full">
                    <CheckCircle className="text-green-500 w-12 h-12" />
                </div>
            </div>

            <h3 className="text-center text-2xl font-bold text-white mb-2">Sesión Finalizada</h3>
            
             {/* Etherscan Link */}
            {txHash && (
                <div className="text-center mb-6">
                    <a 
                        href={`https://sepolia.etherscan.io/tx/${txHash}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-blue-500 hover:text-blue-400 text-sm flex items-center justify-center gap-1"
                    >
                        Ver transacción en Etherscan <ExternalLink size={14} />
                    </a>
                </div>
            )}
        </>
      ) : (
        <div className="mb-8">
            <h3 className="text-lg text-gray-300 mb-4">Resumen de la Sesión</h3>
            <p className="text-sm text-gray-400 mb-4">
                Confirma para enviar la transacción de cierre a la blockchain y recuperar tus fondos restantes.
            </p>
        </div>
      )}

      {/* Stats Card - Always Visible */}
      <div className="bg-[#0a0c10] rounded-lg p-6 mb-8 border border-white/5 space-y-4">
        <div className="flex justify-between items-center text-gray-400">
            <span>Depósito Inicial:</span>
            <span className="font-mono text-white">{initialDeposit.toFixed(2)} USDC</span>
        </div>
        <div className="flex justify-between items-center text-gray-400">
            <span>Servicios Utilizados:</span>
            <span className="font-mono text-red-500">- {spent.toFixed(4)}</span>
        </div>
        <div className="h-px bg-white/10 my-2" />
        <div className="flex justify-between items-center text-lg font-bold">
            <span className="text-white">A Reembolsar:</span>
            <span className="font-mono text-green-500">{balance.toFixed(2)} USDC</span>
        </div>
      </div>

      {/* Action Buttons */}
      {step === 'success' ? (
        <button
            onClick={handleRestart}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-lg border border-white/10"
        >
            Volver al Inicio
        </button>
      ) : (
        <button
            onClick={handleSettle}
            disabled={step === 'processing'}
            className="relative overflow-hidden w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-yellow-400/50 text-black font-bold py-4 rounded-lg shadow-[0_0_20px_rgba(250,204,21,0.2)] flex items-center justify-center gap-2 transition-all"
        >
            {step === 'processing' && (
                <div 
                    className="absolute left-0 top-0 bottom-0 bg-white/30 transition-all duration-[800ms] ease-out"
                    style={{ width: `${progress}%` }}
                />
            )}
            
            {step === 'processing' ? (
                <>
                   <Loader2 className="animate-spin relative z-10" />
                   <span className="relative z-10">
                       {progress < 50 ? 'Retirando Custodia (1/2)...' : 'Pagando Tarifa (2/2)...'}
                   </span>
                </>
            ) : (
                <>
                    Confirmar y Liquidar Stake <ArrowRight size={18} />
                </>
            )}
        </button>
      )}

    </Modal>
  );
}
