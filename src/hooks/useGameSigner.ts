import { useSignTypedData } from 'wagmi';
import { useSession } from '../context/SessionContext';
import { CONTRACTS, CHAIN_ID } from '../config/constants';

// EIP-712 Domain as defined in the SessionSafe contract
const domain = {
  name: 'YellowSession',
  version: '1',
  chainId: CHAIN_ID,
  verifyingContract: CONTRACTS.SessionSafe as `0x${string}`,
} as const;

// The data structure we are signing
const types = {
  GameMove: [
    { name: 'gameId', type: 'string' },
    { name: 'move', type: 'string' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;

export function useGameSigner() {
  const { signTypedDataAsync } = useSignTypedData();
  const { sessionAccount } = useSession();

  const signMove = async (gameId: string, move: string, nonce: number) => {
    try {
      // Priority 1: Use Session Key (No Popup)
      if (sessionAccount) {
        console.log("✍️ Signing with Session Key:", sessionAccount.address);
        const signature = await sessionAccount.signTypedData({
            domain,
            types,
            primaryType: 'GameMove',
            message: {
                gameId,
                move,
                nonce: BigInt(nonce),
            }
        });
        return signature;
      }

      // Priority 2: Fallback to Wallet (Popup) if no session key
      console.warn("⚠️ No Session Key found. Falling back to Wallet (Popup will appear).");
      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: 'GameMove',
        message: {
          gameId,
          move,
          nonce: BigInt(nonce),
        },
      });
      return signature;
    } catch (error) {
      console.error('Error signing move:', error);
      throw error;
    }
  };

  return { signMove };
}
