// Chess Types
export interface StartGameDto {
  walletAddress: string;
  wagerAmount: number; // 0 for free play
  signature: string;
  opponentAddress?: string;
}

export interface JoinGameDto {
  gameId: string;
  walletAddress: string;
  signature: string;
}

export interface MakeMoveDto {
  gameId: string;
  move: string; // SAN format e.g., "e4"
  nonce: number;
  signature: string;
  walletAddress: string;
}

export interface ClaimVictoryDto {
  gameId: string;
  walletAddress: string;
  signature: string;
}

export interface ChessGameState {
  gameId: string;
  player1: string;
  player2?: string;
  fen: string;
  wagerAmount: number;
  status: 'pending' | 'active' | 'completed';
  winner?: string;
  turn: 'w' | 'b';
}

// Trading Types
export interface MarketData {
  market: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

export interface OrderbookOrder {
  price: number;
  size: number;
  orders: number;
}

export interface Orderbook {
  market: string;
  bids: OrderbookOrder[];
  asks: OrderbookOrder[];
  spread: number;
  lastPrice: number;
  timestamp: number;
}

export interface Trade {
  market: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  time: number;
}

// SessionSafe Types
export interface DepositDto {
  userAddress: string;
  amount: number;
  txHash: string; // On-chain transaction hash
}

export interface SettleDto {
  sessionId: string;
  finalBalance: string;
  backendSig: string;
  userSig: string;
}
