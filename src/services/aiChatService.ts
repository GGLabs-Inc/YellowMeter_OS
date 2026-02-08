import { io, Socket } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

export interface SessionData {
  sessionId: string;
  balance: string;
  nonce: number;
}

export interface QueryResult {
  response: string;
  newState: {
    balance: string;
    nonce: number;
  };
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export class AiChatService {
  private socket: Socket | null = null;
  private sessionId: string | null = null;

  /**
   * 🆕 CREAR SESIÓN
   */
  async createSession(
    userAddress: string,
    depositAmount: string
  ): Promise<SessionData> {
    const response = await fetch(`${API_BASE}/ai-chat/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userAddress, depositAmount }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create session');
    }

    const data = await response.json();
    this.sessionId = data.sessionId;
    return data;
  }

  /**
   * 🔑 CREAR SESSION KEY
   */
  async createSessionKey(
    sessionId: string,
    userAddress: string,
    signMessage: (message: string) => Promise<string>
  ): Promise<string> {
    const expiry = Date.now() + 3600000; // 1 hora

    // Construir mensaje para firmar
    const message = [
      'AI Chat Session Key Authorization',
      `Session ID: ${sessionId}`,
      `User Address: ${userAddress}`,
      `Expiry: ${expiry}`,
      'Permissions: ai.query, ai.payment',
      `Max Amount: 100 USDC`,
    ].join('\n');

    // Firmar con wallet
    const signature = await signMessage(message);

    // Enviar al backend
    const response = await fetch(
      `${API_BASE}/ai-chat/sessions/${sessionId}/session-key`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress,
          expiry,
          signature,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create session key');
    }

    const data = await response.json();
    return data.sessionKey;
  }

  /**
   * 💬 ENVIAR CONSULTA A IA
   */
  async query(
    sessionId: string,
    nonce: number,
    modelId: string,
    prompt: string,
    maxCost: string,
    signMessage: (message: string) => Promise<string>
  ): Promise<QueryResult> {
    const timestamp = Date.now();

    // Construir mensaje de consulta
    const queryMessage = {
      sessionId,
      nonce,
      modelId,
      prompt,
      maxCost,
      timestamp,
    };

    // Firmar consulta
    const message = JSON.stringify(queryMessage);
    const signature = await signMessage(message);

    // Enviar consulta
    const response = await fetch(`${API_BASE}/ai-chat/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...queryMessage,
        signature,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Query failed');
    }

    return response.json();
  }

  /**
   * 🔌 CONECTAR WEBSOCKET
   */
  connectWebSocket(
    sessionId: string,
    callbacks: {
      onMessage?: (data: unknown) => void;
      onBalanceUpdate?: (data: { balance: string; nonce: number }) => void;
      onError?: (error: Error) => void;
      onConnect?: () => void;
    }
  ): Socket {
    this.socket = io(WS_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      // Suscribirse a la sesión
      this.socket?.emit('subscribe:session', { sessionId });
      callbacks.onConnect?.();
    });

    if (callbacks.onMessage) {
      this.socket.on('message:new', callbacks.onMessage);
    }

    if (callbacks.onBalanceUpdate) {
      this.socket.on('balance:update', callbacks.onBalanceUpdate);
    }

    if (callbacks.onError) {
      this.socket.on('error', callbacks.onError);
    }

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    return this.socket;
  }

  /**
   * 💰 OBTENER BALANCE
   */
  async getBalance(sessionId: string): Promise<{ balance: string; nonce: number }> {
    const response = await fetch(
      `${API_BASE}/ai-chat/sessions/${sessionId}/balance`
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get balance');
    }
    return response.json();
  }

  /**
   * 📋 OBTENER MENSAJES
   */
  async getMessages(sessionId: string, limit = 50): Promise<AiChatMessage[]> {
    const response = await fetch(
      `${API_BASE}/ai-chat/sessions/${sessionId}/messages?limit=${limit}`
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get messages');
    }
    const data = await response.json();
    return data.messages || [];
  }

  /**
   * 🔒 CERRAR SESIÓN
   */
  async closeSession(
    sessionId: string,
    userAddress: string,
    signMessage: (message: string) => Promise<string>
  ) {
    const message = `Close session ${sessionId} for ${userAddress}`;
    const signature = await signMessage(message);

    const response = await fetch(
      `${API_BASE}/ai-chat/sessions/${sessionId}/close`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress, signature }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to close session');
    }

    return response.json();
  }

  /**
   * 🤖 LISTAR MODELOS
   */
  async listModels() {
    const response = await fetch(`${API_BASE}/ai-chat/models`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to list models');
    }
    return response.json();
  }

  /**
   * 🔌 DESCONECTAR
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Obtener ID de sesión actual
   */
  getSessionId(): string | null {
    return this.sessionId;
  }
}

// Singleton instance
let aiChatServiceInstance: AiChatService | null = null;

export function getAiChatService(): AiChatService {
  if (!aiChatServiceInstance) {
    aiChatServiceInstance = new AiChatService();
  }
  return aiChatServiceInstance;
}
