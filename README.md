# ⚡ YellowMeter OS (Frontend)

Interfaz de usuario moderna construida con **React, Vite y TailwindCSS**. Diseñada para interactuar con la infraestructura de **Yellow Network**, permitiendo a los usuarios depositar fondos, firmar transacciones off-chain y liquidar ganancias en una experiencia "Cinemática".

## ⚡ Tecnologías

*   **Framework**: React + Vite (TypeScript)
*   **Web3**: Wagmi + Viem (Conexión a Sepolia)
*   **Estilos**: TailwindCSS + Lucide Icons
*   **Gestión de Estado**: Context API (`SessionContext`) persistente.

## 🌊 Flujos Principales

### 1. Depósito (On-Chain)
El usuario bloquea fondos en el contrato de custodia (`Adjudicator`) para abrir un canal.
*   **Archivo**: `src/components/modals/DepositModal.tsx`
*   **Acciones**:
    1.  `USDC.approve(Adjudicator, amount)`
    2.  `Adjudicator.deposit(user, token, amount)`

### 2. Operación Off-Chain (AI Chat)
El usuario interactúa con servicios (ej. Chatbot) sin pagar gas por mensaje.
*   **Archivo**: `src/components/modals/AiChatModal.tsx`
*   **Lógica**:
    1.  Genera un estado local (Balance actual - Costo servicio).
    2.  Crea un mensaje determinista: `CHANNEL:...|NONCE:...`.
    3.  Firma el mensaje con su wallet (`viem`).
    4.  Envía la firma al Backend para validación.

### 3. Persistencia de Sesión
Para evitar pérdida de fondos al recargar la página, almacenamos las claves de sesión.
*   **Archivo**: `src/context/SessionContext.tsx`
*   **Storage**: `localStorage` guarda `sessionPrivateKey`, `balance`, y `logs`.

### 4. Liquidación (Settlement)
Cierre del canal y retiro de fondos. Implementa un **Retiro en 2 Pasos** para asegurar la liquidez.
*   **Archivo**: `src/components/modals/SettlementModal.tsx`
*   **Pasos**:
    1.  **Withdraw**: Retira el 100% de los fondos depositados del contrato `Adjudicator`.
    2.  **Fee Payment**: Envía una transferencia de USDC (`transfer`) a la wallet del servidor por el monto consumido.

## 🛠️ Configuración

### Variables de Entorno (.env)

Crea un archivo `.env` en la raíz del proyecto para conectar con el backend y servicios externos.

```dotenv
# Backend API (Local o Producción)
# Local: http://localhost:3000
# Producción: https://yellowmeter-backend.onrender.com
VITE_BACKEND_URL=https://yellowmeter-backend.onrender.com
```

### Constantes Globales
Las direcciones de contratos se encuentran en `src/config/constants.ts`:

```typescript
export const CONTRACTS = {
  USDC: '0x1c...7238',
  Adjudicator: '0x01...b262',
  ServerWallet: '0x5C...35C' // Tesorería
};
```

## 🚀 Ejecución

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## 📂 Estructura del Proyecto

```
src/
├── components/
│   ├── modals/       # Deposit, Settlement, AI Chat
│   ├── layout/       # StateBar, Dashboard
│   └── ui/           # Componentes base
├── context/          # SessionContext (Estado Global)
├── services/         # ai.service.ts (API Calls)
├── config/           # Constantes Web3
└── App.tsx           # Entry Point
```
