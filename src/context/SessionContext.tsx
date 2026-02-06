import { createContext, useContext, useState, type ReactNode } from 'react';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { type LocalAccount } from 'viem';

interface SessionLog {
  action: string;
  cost: number;
  hash: string;
  timestamp: string;
}

interface SessionContextType {
  isChannelOpen: boolean;
  balance: number;
  initialDeposit: number;
  actionsCount: number;
  logs: SessionLog[];
  sessionAccount: LocalAccount | null;
  // Actions
  openChannel: (amount: number) => void;

  closeChannel: () => void;
  addLog: (action: string, cost: number, signature?: string) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isChannelOpen, setIsChannelOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [initialDeposit, setInitialDeposit] = useState(0);
  const [actionsCount, setActionsCount] = useState(0);
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [sessionAccount, setSessionAccount] = useState<LocalAccount | null>(null);

  const openChannel = (amount: number) => {
    // Generate ephemeral key for this session
    const pKey = generatePrivateKey();
    const account = privateKeyToAccount(pKey);
    setSessionAccount(account);
    console.log("⚡ Session Key Generated:", account.address);

    setInitialDeposit(amount);
    setBalance(amount);
    setIsChannelOpen(true);
    setActionsCount(0);
    setLogs([]);
  };

  const closeChannel = () => {
    // Here we would trigger the blockchain settlement
    setIsChannelOpen(false);
    setSessionAccount(null);
  };

  const addLog = (action: string, cost: number, signature: string = '0x...') => {
    setActionsCount((prev) => prev + 1);
    setBalance((prev) => Math.max(0, prev - cost));
    setLogs((prev) => [
      {
        action,
        cost,
        hash: signature,
        timestamp: new Date().toLocaleTimeString(),
      },
       ...prev
    ]);
  };

  return (
    <SessionContext.Provider value={{
      isChannelOpen,
      balance,
      initialDeposit,
      actionsCount,
      logs,
      sessionAccount,
      openChannel,
      closeChannel,
      addLog
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
