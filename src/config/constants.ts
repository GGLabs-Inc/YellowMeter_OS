export const BACKEND_URL = 'http://localhost:3000';
export const WS_URL = 'http://localhost:3000';

export const CONTRACTS = {
  MockUSDC: '0x6dE0e73966474a1564d5E582e833E7B296a46D1F',
  SessionSafe: '0x4e4E5c6c5A5ED45D437FAf7279fAC23D24e48890',
} as const;

export const CHAIN_ID = 11155111; // Sepolia

export const NAMESPACES = {
  CHESS: `${WS_URL}/chess`,
  TRADING: `${WS_URL}/trading`,
} as const;
