export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
export const WS_URL = BACKEND_URL;

export const CONTRACTS = {
  USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia USDC Faucet
  Adjudicator: '0x019B65A265EB3363822f2752141b3dF16131b262', // Yellow Network Sepolia Custody
  ServerWallet: '0x5C18Cb1245bdca02289e1c1f209846D245d4135C', // Backend Treasury
} as const;

export const CHAIN_ID = 11155111; // Sepolia

export const NAMESPACES = {
  CHESS: `${WS_URL}/chess`,
  TRADING: `${WS_URL}/trading`,
} as const;
