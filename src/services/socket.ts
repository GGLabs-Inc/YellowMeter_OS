import { io, Socket } from 'socket.io-client';
import { NAMESPACES } from '../config/constants';

class SocketService {
  private chessSocket: Socket | null = null;
  private tradingSocket: Socket | null = null;

  // --- Chess Connection ---
  public connectChess(): Socket {
    if (!this.chessSocket) {
      console.log('♟️ Connecting to Chess Gateway...');
      this.chessSocket = io(NAMESPACES.CHESS, {
        transports: ['websocket'],
        autoConnect: true,
      });

      this.chessSocket.on('connect', () => {
        console.log('✅ Chess Socket Connected:', this.chessSocket?.id);
      });

      this.chessSocket.on('disconnect', () => {
        console.log('❌ Chess Socket Disconnected');
      });

      this.chessSocket.on('connect_error', (err) => {
        console.error('⚠️ Chess Connection Error:', err);
      });
    }
    return this.chessSocket;
  }

  public disconnectChess() {
    if (this.chessSocket) {
      this.chessSocket.disconnect();
      this.chessSocket = null;
    }
  }

  public getChessSocket(): Socket | null {
    return this.chessSocket;
  }

  // --- Trading Connection ---
  public connectTrading(): Socket {
    if (!this.tradingSocket) {
      console.log('📈 Connecting to Trading Gateway...');
      this.tradingSocket = io(NAMESPACES.TRADING, {
        transports: ['websocket'],
        autoConnect: true,
      });

      this.tradingSocket.on('connect', () => {
        console.log('✅ Trading Socket Connected:', this.tradingSocket?.id);
      });

      this.tradingSocket.on('disconnect', () => {
        console.log('❌ Trading Socket Disconnected');
      });
      
      this.tradingSocket.on('connect_error', (err) => {
          console.error('⚠️ Trading Connection Error:', err);
      });
    }
    return this.tradingSocket;
  }

  public disconnectTrading() {
    if (this.tradingSocket) {
      this.tradingSocket.disconnect();
      this.tradingSocket = null;
    }
  }

  public getTradingSocket(): Socket | null {
    return this.tradingSocket;
  }
}

export const socketService = new SocketService();
