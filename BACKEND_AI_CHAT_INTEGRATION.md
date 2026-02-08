# Backend AI Chat Integration con Yellow Network SDK

## 📋 Resumen

Este documento describe la integración del **AI Chat Gateway** con **Yellow Network** usando State Channels para pagos off-chain de consultas a modelos de IA.

---

## 🏗️ Estructura Actual del Frontend

### `AiChatModal.tsx` - Estado Actual

El frontend implementa un chat de IA con las siguientes características:

```typescript
// Modelos disponibles con pricing
const MODEL_GROUPS = [
  { id: 'auto', name: 'Auto (Best)', cost: 0.02 },
  { id: 'gpt-4o', name: 'GPT-4o', cost: 0.03 },
  { id: 'claude-sonnet-4.5', name: 'Claude Sonnet 4.5', cost: 0.03 },
  { id: 'gemini-3-pro', name: 'Gemini 3 Pro', cost: 0.03 },
  // ... más modelos
];
```

**Flujo actual:**
1. Usuario escribe mensaje
2. Frontend registra log: `addLog(\`AI_QUERY: ${modelId}\`, cost, signature)`
3. Llama a Deepseek API (actualmente hardcoded)
4. Muestra respuesta

**Problema:** 
- No hay backend real
- Firma es simulada: `0x${Math.random().toString(16)}`
- No usa Yellow Network para pagos

---

## 🎯 Integración Requerida con Yellow Network

### 1. **State Channel Session** (Canal de Estado)

Cada usuario que abre el AI Chat necesita un **State Channel** con el backend/proveedor de IA.

```typescript
// Backend: Inicializar sesión cuando usuario abre el modal
import { Nitro } from '@statechannels/nitro-client';

interface AiChatSession {
  channelId: string;
  userAddress: string;
  balance: bigint; // Balance depositado en el canal
  nonce: number;   // Contador de mensajes
  status: 'OPEN' | 'ACTIVE' | 'CLOSED';
}

async function createAiChatSession(userAddress: string, depositAmount: bigint) {
  const channel = await nitro.createChannel({
    participants: [userAddress, providerAddress],
    appDefinition: AI_CHAT_APP_ADDRESS,
    challengeDuration: 60, // 60 segundos
  });

  return {
    channelId: channel.id,
    userAddress,
    balance: depositAmount,
    nonce: 0,
    status: 'OPEN',
  };
}
```

**Referencia:** [Yellow - App Sessions](https://docs.yellow.org/docs/learn/core-concepts/app-sessions)

---

### 2. **Session Keys** (Claves Delegadas)

Usar **Session Keys** para que el usuario no firme cada consulta manualmente.

```typescript
// Frontend: Generar session key al abrir modal
import { SessionKeyManager } from '@yellow-network/sdk';

async function initializeSessionKey() {
  const sessionKey = await SessionKeyManager.create({
    expiry: Date.now() + 3600000, // 1 hora
    permissions: ['ai.query', 'ai.payment'],
    maxAmount: parseUnits('10', 6), // Máximo 10 USDC por sesión
  });

  // Firma una vez con la wallet principal
  const signature = await signer.signMessage(sessionKey.message);
  
  return { sessionKey, signature };
}
```

**Backend valida:**
```typescript
async function verifySessionKey(sessionKey: SessionKey, signature: string) {
  const recovered = ethers.utils.verifyMessage(sessionKey.message, signature);
  return recovered === sessionKey.userAddress;
}
```

**Referencia:** [Yellow - Session Keys](https://docs.yellow.org/docs/learn/core-concepts/session-keys)

---

### 3. **Message Envelope** (Firmas Off-Chain)

Cada consulta de IA debe ser una **transacción off-chain firmada**.

```typescript
// Frontend: Firmar consulta
interface AiQueryMessage {
  sessionId: string;
  nonce: number;
  modelId: string;
  prompt: string;
  maxCost: bigint; // En wei de USDC
  timestamp: number;
}

async function signAiQuery(
  query: AiQueryMessage, 
  sessionKey: SessionKey
): Promise<SignedMessage> {
  const message = {
    channelId: query.sessionId,
    nonce: query.nonce,
    data: {
      action: 'ai.query',
      model: query.modelId,
      prompt: query.prompt,
      maxCost: query.maxCost.toString(),
    },
    timestamp: query.timestamp,
  };

  const signature = await sessionKey.sign(message);
  
  return { message, signature };
}
```

**Backend procesa:**
```typescript
async function processAiQuery(signedMessage: SignedMessage) {
  // 1. Verificar firma
  if (!verifyMessageSignature(signedMessage)) {
    throw new Error('Invalid signature');
  }

  // 2. Verificar balance del canal
  const session = await getSession(signedMessage.message.channelId);
  if (session.balance < signedMessage.message.data.maxCost) {
    throw new Error('Insufficient channel balance');
  }

  // 3. Actualizar estado del canal (off-chain)
  session.balance -= BigInt(signedMessage.message.data.maxCost);
  session.nonce += 1;

  // 4. Ejecutar consulta a IA
  const aiResponse = await callAiModel(
    signedMessage.message.data.model,
    signedMessage.message.data.prompt
  );

  // 5. Devolver respuesta y nuevo estado del canal
  return {
    response: aiResponse,
    newState: {
      balance: session.balance,
      nonce: session.nonce,
    },
  };
}
```

**Referencia:** [Yellow - Message Envelope](https://docs.yellow.org/docs/learn/core-concepts/message-envelope)

---

### 4. **Challenge-Response** (Resolución de Disputas)

Si usuario o backend se desconectan/disputan, usar mecanismo de challenge.

```typescript
// Usuario puede cerrar el canal forzosamente si el backend no responde
async function challengeAndClose(channelId: string, lastValidState: ChannelState) {
  const tx = await aiChatContract.challenge(
    channelId,
    lastValidState,
    lastValidState.signature
  );

  await tx.wait();

  // Esperar período de challenge (60s)
  setTimeout(async () => {
    const finalizeTx = await aiChatContract.finalize(channelId);
    await finalizeTx.wait();
    // Fondos devueltos a la wallet del usuario
  }, 60000);
}
```

**Referencia:** [Yellow - Challenge-Response](https://docs.yellow.org/docs/learn/core-concepts/challenge-response)

---

## 🔧 Arquitectura Backend Propuesta

```
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │ WebSocket /
       │ HTTP API
       ▼
┌─────────────────────┐
│  Backend Server     │
│  (Node.js/Express)  │
├─────────────────────┤
│ • Session Manager   │
│ • Signature Verify  │
│ • Channel State DB  │
└──────┬──────────────┘
       │
       ├──► Yellow Nitro Client
       │    (State Channels)
       │
       └──► AI Providers
            • OpenAI
            • Anthropic
            • Google Gemini
            • Deepseek
```

---

## 📦 Dependencias Necesarias (Backend)

```json
{
  "dependencies": {
    "@statechannels/nitro-client": "^1.0.0",
    "@yellow-network/sdk": "^2.0.0",
    "ethers": "^6.9.0",
    "express": "^4.18.0",
    "ws": "^8.14.0",
    "openai": "^4.28.0",
    "@anthropic-ai/sdk": "^0.14.0",
    "@google/generative-ai": "^0.1.3"
  }
}
```

---

## 🚀 Implementación Paso a Paso

### **Paso 1: Setup Backend básico**

```typescript
// server.ts
import express from 'express';
import { Nitro } from '@statechannels/nitro-client';
import { ethers } from 'ethers';

const app = express();
app.use(express.json());

// Inicializar Nitro Client
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PROVIDER_PRIVATE_KEY, provider);
const nitro = new Nitro({ wallet, provider });

await nitro.start();

// Endpoint: Crear sesión de chat
app.post('/api/sessions/create', async (req, res) => {
  const { userAddress, depositAmount } = req.body;
  
  const session = await createAiChatSession(userAddress, depositAmount);
  
  res.json({
    sessionId: session.channelId,
    balance: session.balance.toString(),
    nonce: session.nonce,
  });
});

// Endpoint: Procesar consulta IA (off-chain)
app.post('/api/ai/query', async (req, res) => {
  const { signedMessage } = req.body;
  
  const result = await processAiQuery(signedMessage);
  
  res.json({
    response: result.response,
    newBalance: result.newState.balance.toString(),
    newNonce: result.newState.nonce,
  });
});

app.listen(3001, () => {
  console.log('AI Chat Backend running on port 3001');
});
```

---

### **Paso 2: Smart Contract (App Definition)**

Desplegar contrato personalizado para el AI Chat:

```solidity
// AiChatApp.sol
pragma solidity ^0.8.0;

import "@statechannels/nitro-protocol/contracts/interfaces/INitroTypes.sol";

contract AiChatApp {
    struct AiChatState {
        address user;
        address provider;
        uint256 userBalance;
        uint256 providerBalance;
        uint256 nonce;
    }

    function validTransition(
        INitroTypes.VariablePart memory oldState,
        INitroTypes.VariablePart memory newState
    ) external pure returns (bool) {
        AiChatState memory old = abi.decode(oldState.appData, (AiChatState));
        AiChatState memory next = abi.decode(newState.appData, (AiChatState));

        // Validar que el nonce incrementa
        if (next.nonce != old.nonce + 1) return false;

        // Validar conservación de fondos
        uint256 oldTotal = old.userBalance + old.providerBalance;
        uint256 newTotal = next.userBalance + next.providerBalance;
        if (oldTotal != newTotal) return false;

        return true;
    }
}
```

---

### **Paso 3: Actualizar Frontend**

```typescript
// AiChatModal.tsx - Modificaciones requeridas

// 1. Inicializar sesión al abrir modal
useEffect(() => {
  if (isOpen) {
    initializeSession();
  }
}, [isOpen]);

async function initializeSession() {
  // Conectar con backend
  const response = await fetch('/api/sessions/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userAddress: address, // De wagmi
      depositAmount: parseUnits('100', 6), // 100 USDC
    }),
  });

  const session = await response.json();
  setSessionId(session.sessionId);
  setChannelBalance(session.balance);
}

// 2. Firmar y enviar consultar (reemplazar handleSend actual)
async function handleSend() {
  if (!inputText.trim() || !sessionId) return;

  const query: AiQueryMessage = {
    sessionId,
    nonce: currentNonce,
    modelId: selectedModel.id,
    prompt: inputText,
    maxCost: parseUnits(selectedModel.cost.toString(), 6),
    timestamp: Date.now(),
  };

  // Firmar con session key
  const signedMessage = await signAiQuery(query, sessionKey);

  // Enviar al backend
  const response = await fetch('/api/ai/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signedMessage }),
  });

  const result = await response.json();

  // Actualizar UI
  setMessages(prev => [...prev, {
    id: Date.now().toString(),
    sender: 'bot',
    text: result.response,
  }]);
  
  setChannelBalance(result.newBalance);
  setCurrentNonce(result.newNonce);
}
```

---

## 🔐 Variables de Entorno

```env
# .env (Backend)
RPC_URL=https://mainnet.base.org
PROVIDER_PRIVATE_KEY=0x...
AI_CHAT_APP_ADDRESS=0x...

# API Keys de proveedores IA
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_KEY=...
DEEPSEEK_API_KEY=sk-...

# Yellow Network
YELLOW_BROKER_URL=https://broker.yellow.org
YELLOW_CLEARINGHOUSE=0x...
```

---

## 📊 Diagrama de Flujo Completo

```
┌─────────┐                  ┌─────────┐                 ┌──────────┐
│ Usuario │                  │ Backend │                 │ Yellow   │
└────┬────┘                  └────┬────┘                 │ Network  │
     │                            │                      └────┬─────┘
     │  1. Abrir Chat Modal       │                           │
     ├───────────────────────────>│                           │
     │                            │                           │
     │  2. Crear State Channel    │                           │
     │                            ├──────────────────────────>│
     │                            │  (Deploy canal on-chain)  │
     │                            │<──────────────────────────┤
     │  3. Session ID + Balance   │                           │
     │<───────────────────────────┤                           │
     │                            │                           │
     │  4. Generar Session Key    │                           │
     │  (firma única)             │                           │
     │                            │                           │
     │  5. Enviar consulta (off-chain)                        │
     │  + firma session key       │                           │
     ├───────────────────────────>│                           │
     │                            │  6. Verificar firma       │
     │                            │                           │
     │                            │  7. Actualizar estado     │
     │                            │     (off-chain)           │
     │                            │                           │
     │                            │  8. Llamar IA API         │
     │                            │  (OpenAI/Anthropic/etc)   │
     │                            │                           │
     │  9. Respuesta IA           │                           │
     │  + nuevo estado del canal  │                           │
     │<───────────────────────────┤                           │
     │                            │                           │
     │  10. Cerrar canal          │                           │
     │  (settle on-chain)         │                           │
     ├───────────────────────────>│                           │
     │                            ├──────────────────────────>│
     │                            │  (Finalize + withdrawal)  │
     │                            │<──────────────────────────┤
     │  11. USDC devuelto         │                           │
     │<───────────────────────────┤                           │
```

---

## 📚 Referencias Yellow Network

| Concepto | Documentación | Tiempo Lectura |
|----------|--------------|----------------|
| **Quickstart** | [Your First Channel](https://docs.yellow.org/docs/learn/getting-started/quickstart) | 10 min |
| **State Channels** | [vs L1/L2](https://docs.yellow.org/docs/learn/core-concepts/state-channels-vs-l1-l2) | 12 min |
| **App Sessions** | [Multi-party channels](https://docs.yellow.org/docs/learn/core-concepts/app-sessions) | 8 min |
| **Session Keys** | [Delegated signing](https://docs.yellow.org/docs/learn/core-concepts/session-keys) | 8 min |
| **Disputes** | [Challenge-Response](https://docs.yellow.org/docs/learn/core-concepts/challenge-response) | 6 min |
| **Message Format** | [Envelope](https://docs.yellow.org/docs/learn/core-concepts/message-envelope) | 5 min |

---

## 🎯 Ventajas de Esta Arquitectura

✅ **Costos bajísimos**: 1 transacción on-chain para abrir, 1 para cerrar. Todo lo demás off-chain.
✅ **Instantáneo**: Consultas de IA procesadas en milisegundos (no esperar blocks).
✅ **Escalable**: Miles de consultas por segundo sin congestionar la blockchain.
✅ **UX fluida**: Usuario firma 1 vez al inicio, luego todo automático con session keys.
✅ **Seguro**: Fondos siempre recuperables con challenge-response.

---

## 🔄 Próximos Pasos

1. **Setup Nitro Client** en backend
2. **Desplegar AiChatApp.sol** en testnet (Base Sepolia)
3. **Implementar endpoints** `/sessions/*` y `/ai/*`
4. **Actualizar frontend** para usar session keys
5. **Testing** con múltiples usuarios concurrentes
6. **Monitorear state transitions** en Yellow Network dashboard

---

## 🆘 Soporte

- **Discord**: [Yellow Network Community](https://discord.com/invite/yellownetwork)
- **GitHub**: [Yellow SDK](https://github.com/layer-3/yellow-sdk)
- **Docs**: [docs.yellow.org](https://docs.yellow.org/)

---

**Fecha**: Enero 2026  
**Versión**: 1.0  
**Stack**: React + Node.js + Yellow Network + Nitro Protocol
