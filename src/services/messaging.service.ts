import { io, Socket } from 'socket.io-client';
import { WS_URL } from '../config/constants';
import type { ChannelState } from './ai.service'; // Reusing type for consistency

export const MESSAGING_NAMESPACE = `${WS_URL}/messaging`;


export interface ChatMessage {
    id: string;
    from: string;
    to: string;
    content: string;
    timestamp: number;
}

export interface ServerResponse {
    status: 'sent' | 'error';
    data?: unknown;
    message?: string;
}

export interface ConversationRaw {
    peerAddress: string;
    peerEns?: string;
    lastMessage: string;
    timestamp: number;
    unreadCount: number;
}

class MessagingService {
    private socket: Socket | null = null;
    private handlers: Map<string, (data: unknown) => void> = new Map();

    connect(userAddress: string) {
        if (this.socket?.connected) return;

        this.socket = io(MESSAGING_NAMESPACE, {
            transports: ['websocket'],
        });

        this.socket.on('connect', () => {
            console.log('✅ Connected to Messaging Gateway');
            this.socket?.emit('register', { address: userAddress });
        });

        this.socket.on('incomingMessage', (message: ChatMessage) => {
            console.log('📩 Incoming Message:', message);
            const handler = this.handlers.get('incomingMessage');
            if (handler) handler(message);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    on(event: string, callback: (data: unknown) => void) {
        this.handlers.set(event, callback);
    }

    off(event: string) {
        this.handlers.delete(event);
    }

    /**
     * Sends a message with an attached Payment (Signed State)
     */
    async sendMessage(to: string, content: string, channelState: ChannelState, senderEns?: string, receiverEns?: string): Promise<{ success: boolean; newServerSignature?: string }> {
        return new Promise((resolve, reject) => {
            if (!this.socket) return reject('Socket not connected');

            this.socket.emit('sendMessage', { to, content, channelState, senderEns, receiverEns }, (response: ServerResponse) => {
                if (response.status === 'sent') {
                    const responseData = response.data as { serverSignature?: string };
                    resolve({ 
                        success: true, 
                        newServerSignature: responseData?.serverSignature 
                    });
                } else {
                    reject(response.message || 'Unknown error');
                }
            });
        });
    }

    async getHistory(myAddress: string, peerAddress: string): Promise<ChatMessage[]> {
        return new Promise((resolve) => {
            if (!this.socket) return resolve([]);
            
            this.socket.emit('getHistory', { me: myAddress, with: peerAddress }, (history: ChatMessage[]) => {
                resolve(history);
            });
        });
    }

    async getConversations(myAddress: string): Promise<ConversationRaw[]> {
        return new Promise((resolve) => {
            if (!this.socket) {
                console.warn("⚠️ Socket not connected, returning empty convs");
                return resolve([]);
            }
            if (!this.socket.connected) {
                console.warn("⚠️ Socket instance exists but disconnected");
            }
            
            console.log("📤 Requesting conversations for", myAddress);
            this.socket.emit('getConversations', { me: myAddress }, (response: ConversationRaw[]) => {
                console.log("📥 Received conversations:", response?.length);
                resolve(response || []);
            });
            
            // Timeout safety
            setTimeout(() => resolve([]), 3000);
        });
    }
}

export const messagingService = new MessagingService();
