import { useState, useEffect } from 'react';
import { useWriteContract, usePublicClient, useAccount } from 'wagmi';
import { parseUnits, parseAbi } from 'viem';
import { Modal } from '../ui/Modal';
import { useSession } from '../../context/SessionContext';
import { Info, Lock, Loader2 } from 'lucide-react';
import { CONTRACTS } from '../../config/constants';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const { openChannel } = useSession();
  const { address } = useAccount();
  
  // Wagmi Hooks
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  
  const [amount, setAmount] = useState('10.00');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'idle' | 'approving' | 'depositing' | 'confirming'>('idle');
  const [progress, setProgress] = useState(0);

  // Simple progress animation effect
  useEffect(() => {
    if (step === 'approving') setProgress(25);
    if (step === 'depositing') setProgress(60);
    if (step === 'confirming') setProgress(90);
    if (step === 'idle') setProgress(0);
  }, [step]);

  const handleDeposit = async () => {
    if (!publicClient || !address) {
        alert("Wallet not connected");
        return;
    }
    
    setIsProcessing(true);
    setStep('approving');
    
    try {
        const amountUnits = parseUnits(amount, 6); // USDC has 6 decimals

        // 1. APPROVE (USDC -> Adjudicator)
        console.log("📝 Approving USDC spending...");
        const approveHash = await writeContractAsync({
            address: CONTRACTS.USDC as `0x${string}`,
            abi: parseAbi(['function approve(address spender, uint256 amount) returns (bool)']),
            functionName: 'approve',
            args: [CONTRACTS.Adjudicator as `0x${string}`, amountUnits],
        });
        console.log("Tx Hash (Approve):", approveHash);
        
        // Wait for confirmation
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        console.log("✅ Approve Confirmed");
        
        setStep('depositing');

        // 2. DEPOSIT (Adjudicator.deposit)
        // Correct Signature: deposit(address account, address token, uint256 amount)
        console.log("💰 Depositing Funds for:", address);
        const depositHash = await writeContractAsync({
            address: CONTRACTS.Adjudicator as `0x${string}`,
            abi: parseAbi(['function deposit(address account, address token, uint256 amount) payable']),
            functionName: 'deposit',
            args: [address, CONTRACTS.USDC as `0x${string}`, amountUnits]
        }); 
        
        console.log("Tx Hash (Deposit):", depositHash);
        setStep('confirming');
        
        await publicClient.waitForTransactionReceipt({ hash: depositHash });
        console.log("✅ Deposit Confirmed");
        setProgress(100);
        
        // 3. Update Session State (Optimistic update for UI)
        openChannel(parseFloat(amount));
        setTimeout(onClose, 1000); // Close after 1s success
        
    } catch (error) {
        console.error("❌ On-Chain Transaction Failed", error);
        alert("Transaction Failed: " + (error as any).message);
    } finally {
        if(step !== 'confirming') { // Only reset if failed, otherwise let it close
            setIsProcessing(false);
            setStep('idle');
        }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="1. Deposit Funds">
      
      {/* Info Box */}
      <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <Info className="text-green-500 shrink-0 mt-0.5" size={20} />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-green-400">Real Transaction (Sepolia Testnode)</h4>
            <p className="text-xs text-green-200/70 leading-relaxed">
              This action will send two transactions to your wallet:
              <br/>1. <b>Approve:</b> Allow Yellow to move your USDC.
              <br/>2. <b>Deposit:</b> Send funds to the Adjudicator contract.
            </p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="space-y-4 mb-6">
        <label className="block text-sm font-medium text-gray-400">
          Amount to Custody (USDC on Sepolia)
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
            USDC
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleDeposit}
        disabled={isProcessing}
        className="relative overflow-hidden w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-yellow-400/50 disabled:cursor-not-allowed text-black font-bold py-4 rounded-lg text-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(250,204,21,0.3)] hover:shadow-[0_0_30px_rgba(250,204,21,0.5)]"
      >
        {isProcessing && (
            <div 
                className="absolute left-0 top-0 bottom-0 bg-white/30 transition-all duration-[800ms] ease-out"
                style={{ width: `${progress}%` }}
            />
        )}
        
        {isProcessing ? (
          <>
            <Loader2 className="animate-spin relative z-10" />
            <span className="relative z-10">
                {step === 'approving' && 'Approving (1/2)...'}
                {step === 'depositing' && 'Depositing (2/2)...'}
                {step === 'confirming' && 'Confirming...'}
            </span>
          </>
        ) : (
          <>
            <Lock size={20} className="relative z-10" />
            <span className="relative z-10">Confirm Deposit</span>
          </>
        )}
      </button>
      
      <p className="text-center text-xs text-gray-500 mt-4">
        Sepolia Chain ID: 11155111
      </p>
    </Modal>
  );
}
