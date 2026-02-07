import { type LocalAccount } from 'viem';
import axios from 'axios';

// Definición de tipos alineada con el Backend
export interface ChannelState {
  channelId: string;
  nonce: number;
  userAddress: string;
  serverAddress: string;
  userBalance: string;
  serverBalance: string;
  signature: string;
}

export interface AIResponse {
  result: string;
  newServerSignature: string;
}

// URL del Backend (Hardcoded por ahora para desarrollo)
const BACKEND_URL = 'http://localhost:3000';

export const aiService = {
  /**
   * Envía una solicitud de inferencia al backend firmada por la Session Key Off-Chain
   */
  async requestInference(
    prompt: string, 
    account: LocalAccount
  ): Promise<AIResponse> {
    if (!account) throw new Error("No hay sesión activa");

    // 1. Construir el objeto de estado (Simulando un canal activo)
    // En producción, estos valores vendrían del estado real acumulado del canal
    const statePayload = {
      channelId: `0xCH_${account.address.slice(2, 10)}`, // ID derivado de la sesión
      nonce: Date.now(), // Usamos timestamp como nonce simple
      userAddress: account.address,
      serverAddress: "0xServerAddressPlaceholder", // El backend valida solo la firma del usuario por ahora
      userBalance: "10000000", // Saldo ficticio alto suficiente
      serverBalance: "500000"
    };

    // 2. Firmar el estado Off-Chain
    // Protocolo Determinista (V2): Cadena separada por pipes "CHANNEL:id|NONCE:n|UBAL:u|SBAL:s"
    // Esto evita errores de espacios o saltos de línea en JSON.stringify
    const messageContent = `CHANNEL:${statePayload.channelId}|NONCE:${statePayload.nonce}|UBAL:${statePayload.userBalance}|SBAL:${statePayload.serverBalance}`;
    
    console.log("📝 Signing Content:", messageContent);
    const signature = await account.signMessage({ message: messageContent });

    // 3. Enviar al Backend
    const body = {
      prompt,
      signedState: {
        ...statePayload, // Enviamos todos los datos estructurados
        signature        // Y la firma sobre el string plano
      }
    };

    console.log("📤 Sending Signed AI Request:", body);
    
    const response = await axios.post<AIResponse>(`${BACKEND_URL}/ai/inference`, body);
    return response.data;
  }
};
