# ⚡ YellowMeter OS (Frontend)

YellowMeter OS is a decentralized, browser-based Operating System designed to simplify Web3 interactions. It introduces a desktop-like interface where apps (Trading, Chess, Chat) interact seamlessly with the blockchain using **Session Keys** and **State Channels**.

## 🚀 Live Demo
**URL:** [https://yellow-meter-os.vercel.app/](https://yellow-meter-os.vercel.app/)

---

## ⚡ Yellow Network Implementation

This is the core innovation of the project. We moved beyond simple wallet signatures to extensive **Session Keys** implementation.

### 1. Session Keys & Nitrolite Client
Instead of asking the user to sign every single chess move or chat message (which ruins UX), we generate a temporary **Session Key** inside the browser.

*   **Logic**: `src/context/SessionContext.tsx`
*   **Mechanism**:
    1.  User "Deposits" funds to open a channel (On-Chain).
    2.  Browser generates a specialized ephemeral private key using `viem`.
    3.  This key is stored securely in local storage for the duration of the session.
    4.  The Frontend signs **thousands** of micro-transactions automatically using this background key.

### 2. EIP-712 Typed Signatures (Strict Protocol)
We use a strongly typed signing domain to ensure the backend can deterministically validate actions.

**Implementation (`src/hooks/useGameSigner.ts`):**
```typescript
const types = {
  GameMove: [
    { name: 'gameId', type: 'string' },
    { name: 'move', type: 'string' },
    { name: 'nonce', type: 'uint256' },
  ]
};
```
This ensures that every signed packet is unforgeable and strictly associated with the active Channel ID.

---

## 🌐 ENS Integration (Identity)

YellowMeter uses ENS as the primary identity layer. We believe users should interact with names, not hex strings.

*   **Forward Resolution**: The Chat and Trading apps accept ENS names (`alice.eth`) and rely on **Wagmi** to resolve them to 0x addresses before initiating channels.
*   **Reverse Resolution**: We display user avatars and names in the "OS Taskbar" and "Profile" sections.
*   **Caching**: To improve performance, resolved names are cached in the local session state.

---

## 🛠 Tech Stack & Architecture

This project is built as a Single Page Application (SPA) simulating a Desktop Environment.

| Layer | Technology | Usage |
| :--- | :--- | :--- |
| **Framework** | **React 19** + **Vite** | Core application logic. |
| **Blockchain** | **Viem** + **Wagmi** | Low-level interaction & Hooks. |
| **State** | **React Context** | Managing the "OS" window manager. |
| **Signatures** | **EIP-712** | Secured off-chain messaging. |
| **Realtime** | **Socket.IO Client** | Bi-directional communication. |
| **UI/UX** | **Tailwind** + **Framer Motion** | Glassmorphism & Animations. |
| **3D** | **Three.js** | Visualizing channel state (optional). |

---

## 📂 Project Structure

```bash
src/
├── components/     # UI Atoms (Windows, Buttons, Inputs)
├── config/         # Constants (Contracts, Chain ID)
├── context/        # Global State (Session, OS Window Manager)
├── hooks/          # Custom Hooks (useGameSigner, useENS)
├── services/       # API & Socket Layers
│   ├── messaging.service.ts  # Chat logic
│   └── socket.ts             # Gateway connection
├── state/          # Channel State Machines
└── App.tsx         # Main OS Entry point
```

## 📦 Setup & Run

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Setup**:
    Create a `.env` file:
    ```bash
    VITE_BACKEND_URL=...
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

---

Created with ⚡ for ETHGlobal Hack Money 2026
