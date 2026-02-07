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
  // --- Persistent State Initialization ---
  
  const [isChannelOpen, setIsChannelOpen] = useState(() => {
    return localStorage.getItem('isChannelOpen') === 'true';
  });

  const [balance, setBalance] = useState(() => {
    const stored = localStorage.getItem('balance');
    return stored ? parseFloat(stored) : 0;
  });

  const [initialDeposit, setInitialDeposit] = useState(() => {
    const stored = localStorage.getItem('initialDeposit');
    return stored ? parseFloat(stored) : 0;
  });

  const [actionsCount, setActionsCount] = useState(() => {
    const stored = localStorage.getItem('actionsCount');
    return stored ? parseInt(stored, 10) : 0;
  });
  
  const [logs, setLogs] = useState<SessionLog[]>(() => {
      const stored = localStorage.getItem('logs');
      return stored ? JSON.parse(stored) : [];
  });

  const [sessionAccount, setSessionAccount] = useState<LocalAccount | null>(() => {
    const storedKey = localStorage.getItem('sessionPrivateKey');
    if (storedKey) {
        try {
            console.log("⚡ Restoring Session Key...");
            return privateKeyToAccount(storedKey as `0x${string}`);
        } catch (e) {
            console.error("Failed to restore session key", e);
            return null;
        }
    }
    return null;
  });

  // --- Persistence Effects ---
  
  // Save basic state whenever it changes
  useState(() => {
     // We use effects for saving.
  });

  // Helper helper to save all state (Effect hook wrapper)
  const saveState = (key: string, value: string) => localStorage.setItem(key, value);
  
  // Effects to persist changes
  useState(() => {
     // Actually, simple effects are cleaner
  });

  const openChannel = (amount: number) => {
    // Generate ephemeral key for this session
    const pKey = generatePrivateKey();
    const account = privateKeyToAccount(pKey);
    
    // Save to State
    setSessionAccount(account);
    setInitialDeposit(amount);
    setBalance(amount);
    setIsChannelOpen(true);
    setActionsCount(0);
    setLogs([]);

    // Save to Storage
    saveState('sessionPrivateKey', pKey);
    saveState('isChannelOpen', 'true');
    saveState('initialDeposit', amount.toString());
    saveState('balance', amount.toString());
    saveState('actionsCount', '0');
    saveState('logs', '[]');
    
    console.log("⚡ Session Key Generated & Saved:", account.address);
  };

  const closeChannel = () => {
    // Here we would trigger the blockchain settlement
    setIsChannelOpen(false);
    setSessionAccount(null);
    
    // Clear Storage
    localStorage.removeItem('isChannelOpen');
    localStorage.removeItem('sessionPrivateKey');
    localStorage.removeItem('balance');
    localStorage.removeItem('initialDeposit');
    localStorage.removeItem('actionsCount');
    localStorage.removeItem('logs');
  };

  const addLog = (action: string, cost: number, signature: string = '0x...') => {
    setActionsCount((prev) => {
        const newVal = prev + 1;
        saveState('actionsCount', newVal.toString());
        return newVal;
    });
    
    setBalance((prev) => {
        const newVal = Math.max(0, prev - cost);
        saveState('balance', newVal.toString());
        return newVal;
    });

    setLogs((prev) => {
        const newLogs = [
            {
              action,
              cost,
              hash: signature,
              timestamp: new Date().toLocaleTimeString(),
            },
             ...prev
          ];
        saveState('logs', JSON.stringify(newLogs));
        return newLogs;
    });
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
