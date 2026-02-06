import { createContext, useContext, useState, type ReactNode } from 'react';

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

  const openChannel = (amount: number) => {
    setInitialDeposit(amount);
    setBalance(amount);
    setIsChannelOpen(true);
    setActionsCount(0);
    setLogs([]);
  };

  const closeChannel = () => {
    // Here we would trigger the blockchain settlement
    setIsChannelOpen(false);
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
