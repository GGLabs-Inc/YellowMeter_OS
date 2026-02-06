import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useSession } from '../../context/SessionContext';
import { Play, Terminal, Database, Cloud, Wifi } from 'lucide-react';
import { useGameSigner } from '../../hooks/useGameSigner';

interface MicroApiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  desc: string;
  cost: number;
  category: 'Data' | 'Identity' | 'Compute';
  responseMock: object;
}

const ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'eth-price',
    method: 'GET',
    path: '/v1/market/prices/ETH-USDC',
    desc: 'Get real-time ETH price from off-chain oracle.',
    cost: 0.005,
    category: 'Data',
    responseMock: { pair: "ETH/USDC", price: 2845.32, timestamp: Date.now(), source: "Yellow Oracle Node 1" }
  },
  {
    id: 'weather-ldn',
    method: 'GET',
    path: '/v1/data/weather/london',
    desc: 'Authenticated weather data feed.',
    cost: 0.002,
    category: 'Data',
    responseMock: { location: "London, UK", temp: 14.2, condition: "Light Rain", humidity: 82 }
  },
  {
    id: 'verify-kyc',
    method: 'POST',
    path: '/v1/identity/verify-proof',
    desc: 'Verify ZK-Proof for age > 18.',
    cost: 0.05,
    category: 'Identity',
    responseMock: { verified: true, age_group: "18+", proof_hash: "0x8f2...a91" }
  },
  {
    id: 'compute-hash',
    method: 'POST',
    path: '/v1/compute/hash-large-file',
    desc: 'Offload heavy computation to worker node.',
    cost: 0.01,
    category: 'Compute',
    responseMock: { status: "completed", hash: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", duration: "12ms" }
  }
];

export function MicroApiModal({ isOpen, onClose }: MicroApiModalProps) {
  const { signApiRequest } = useGameSigner();
  const { addLog, balance, sessionAccount } = useSession();
  
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(ENDPOINTS[0]);
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const handleExecute = async () => {
    if (!sessionAccount) return;
    
    setIsLoading(true);
    setResponse(null);
    setLogs(prev => [...prev, `> Connecting to ${selectedEndpoint.path}...`]);

    try {
      // 1. Construct payload
      const payload = {
        action: 'api_call',
        endpoint: selectedEndpoint.path,
        timestamp: Date.now(),
        nonce: Math.floor(Math.random() * 1000000)
      };

      // 2. Sign payload (Micro-payment authorization)
      setLogs(prev => [...prev, `> Signing request with Session Key (Cost: $${selectedEndpoint.cost})...`]);
      // Calling the new specific signing function instead of generic game action
      const signature = await signApiRequest(selectedEndpoint.path, payload.timestamp, payload.nonce);
      
      setLogs(prev => [...prev, `> Signature generated: ${signature.slice(0, 20)}...`]);
      setLogs(prev => [...prev, `> Verifying payment channel... OK`]);

      // 3. Simulate Network Delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // 4. "Deduct" balance locally via logging
      addLog(`API Call: ${selectedEndpoint.id}`, selectedEndpoint.cost, signature);

      // 5. Show Response
      const responseData = {
        ...selectedEndpoint.responseMock,
        _meta: {
            charged: selectedEndpoint.cost,
            signature_verified: true,
            node_id: "node-yellow-eu-west-1"
        }
      };
      setResponse(JSON.stringify(responseData, null, 2));

    } catch (error) {
      console.error(error);
      setLogs(prev => [...prev, `> Error: Failed to execute request`]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Micro-API Gateway"
      className="max-w-[95vw] p-0 bg-transparent border-0 shadow-none"
    >
      <div className="flex h-[80vh] w-[95vw] max-w-[1600px] bg-[#1e1e1e] text-gray-300 font-mono text-sm overflow-hidden rounded-xl border border-[#333] shadow-2xl">
        
        {/* Sidebar */}
        <div className="w-1/3 border-r border-[#333] flex flex-col bg-[#252526]">
          <div className="p-3 bg-[#1e1e1e] border-b border-[#333] font-semibold text-gray-200 flex items-center gap-2">
            <Cloud size={16} className="text-blue-400"/> Available Services
          </div>
          <div className="flex-1 overflow-y-auto">
            {ENDPOINTS.map(ep => (
              <div 
                key={ep.id}
                onClick={() => {
                    setSelectedEndpoint(ep);
                    setResponse(null);
                    setLogs([]);
                }}
                className={`p-3 border-b border-[#333] cursor-pointer hover:bg-[#2a2d2e] transition-colors ${selectedEndpoint.id === ep.id ? 'bg-[#37373d] text-white border-l-2 border-l-yellow-500' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${ep.method === 'GET' ? 'bg-blue-900 text-blue-200' : 'bg-green-900 text-green-200'}`}>
                    {ep.method}
                  </span>
                  <span className="text-xs text-yellow-500">${ep.cost}</span>
                </div>
                <div className="truncate text-xs text-gray-400">{ep.path}</div>
                <div className="text-[10px] mt-1 text-gray-500">{ep.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="w-2/3 flex flex-col bg-[#1e1e1e]">
             {/* Header */}
            <div className="p-4 border-b border-[#333] bg-[#1e1e1e] flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                    <span className="font-bold text-green-400">{selectedEndpoint.method}</span>
                    <span className="text-gray-400 truncate">{selectedEndpoint.path}</span>
                </div>
                
                <div className="flex items-center gap-4">
                     <div className="text-right">
                        <div className="text-[10px] text-gray-500">SESSION BALANCE</div>
                        <div className="text-sm font-bold text-yellow-400">${balance.toFixed(4)}</div>
                    </div>
                </div>
            </div>

            {/* Logs / Terminal */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                
                {/* Request Payload Visualization */}
                <div className="space-y-2">
                    <div className="flex items-center text-xs text-gray-400 uppercase tracking-wider gap-2">
                        <Terminal size={12}/> Console Output
                    </div>
                    <div className="bg-black/50 p-3 rounded-md font-mono text-xs text-green-300 min-h-[100px] border border-[#333]">
                         {logs.length === 0 ? <span className="text-gray-600 opacity-50">// System ready over state channel...</span> : logs.map((log, i) => (
                             <div key={i}>{log}</div>
                         ))}
                         {isLoading && <div className="animate-pulse">_</div>}
                    </div>
                </div>

                {/* Response Area */}
                <div className="space-y-2 flex-col flex h-1/2">
                    <div className="flex items-center text-xs text-gray-400 uppercase tracking-wider gap-2">
                        <Database size={12}/> Response Body
                    </div>
                    {response ? (
                        <div className="flex-1 bg-[#1e1e1e] border border-[#333] p-3 rounded-md overflow-auto">
                            <pre className="text-xs text-blue-300 language-json">
                                {response}
                            </pre>
                        </div>
                    ) : (
                        <div className="flex-1 border border-dashed border-[#333] rounded-md flex items-center justify-center text-gray-600 text-xs">
                            No response data
                        </div>
                    )}
                </div>

            </div>

             {/* Footer Action */}
             <div className="p-4 border-t border-[#333] bg-[#252526] flex justify-end items-center gap-4">
                <div className="text-xs text-gray-400">
                    Calculated Gas: <span className="text-green-400">$0.00</span> (Off-chain)
                </div>
                <button 
                    onClick={handleExecute}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Wifi className="animate-pulse" size={16}/> : <Play size={16} fill="black" />}
                    {isLoading ? 'Signing...' : `Execute ($${selectedEndpoint.cost})`}
                </button>
            </div>
        </div>

      </div>
    </Modal>
  );
}
