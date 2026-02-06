import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useSession } from '../../context/SessionContext';
import { ArrowUpRight, Activity, BookOpen } from 'lucide-react';

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock Order Book Data
const BIDS = Array.from({ length: 8 }, (_, i) => ({
    price: 2845.20 - (i * 0.15),
    size: (Math.random() * 2 + 0.1).toFixed(3),
    total: (Math.random() * 10 + 1).toFixed(2)
}));

const ASKS = Array.from({ length: 8 }, (_, i) => ({
    price: 2845.50 + (i * 0.15),
    size: (Math.random() * 2 + 0.1).toFixed(3),
    total: (Math.random() * 10 + 1).toFixed(2)
})).reverse();

export function TradingModal({ isOpen, onClose }: TradingModalProps) {
  const { balance } = useSession();
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [price, setPrice] = useState('2845.50');
  const [amount, setAmount] = useState('');

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Yellow Professional DEX" 
      className="max-w-[95vw] p-0 bg-transparent border-0 shadow-none"
    >
      <div className="flex h-[85vh] w-[95vw] max-w-[1600px] bg-[#0b0e11] text-gray-300 font-sans text-sm overflow-hidden rounded-xl border border-[#333] shadow-2xl">
        
        {/* LEFT COLUMN: Charts */}
        <div className="flex-1 flex flex-col border-r border-[#333]">
            {/* Ticker Header */}
            <div className="h-14 border-b border-[#333] flex items-center justify-between px-6 bg-[#15171e]">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white text-xs">ETH</div>
                        <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center font-bold text-white text-xs -ml-4 border-2 border-[#15171e]">USDC</div>
                    </div>
                    <div>
                        <h3 className="text-white font-bold flex items-center gap-2">
                            ETH / USDC 
                            <span className="bg-[#333] text-xs px-2 py-0.5 rounded text-gray-400">Perp</span>
                        </h3>
                        <span className="text-xs text-green-400 font-mono flex items-center gap-1">
                            $2,845.50 <ArrowUpRight size={12}/> (+2.45%)
                        </span>
                    </div>
                </div>
                
                <div className="flex gap-6 text-xs text-gray-400">
                    <div>
                        <div className="text-gray-500">24h Volume</div>
                        <div className="text-white">$142.5M</div>
                    </div>
                    <div>
                        <div className="text-gray-500">Open Interest</div>
                        <div className="text-white">$89.2M</div>
                    </div>
                    <div>
                         <div className="text-gray-500">Predicted Funding</div>
                         <div className="text-orange-400">0.004%</div>
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 bg-[#0b0e11] relative p-4 flex items-center justify-center border-b border-[#333]">
                 {/* Fake Chart Grid */}
                 <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 opacity-10 pointer-events-none">
                     {Array.from({length: 72}).map((_, i) => (
                         <div key={i} className="border-r border-b border-gray-500"></div>
                     ))}
                 </div>
                 
                 {/* Placeholder for TradingView */}
                 <div className="text-center z-10">
                    <Activity size={64} className="mx-auto text-gray-700 mb-4" />
                    <h3 className="text-xl font-bold text-gray-600">TradingView Chart Loaded</h3>
                    <p className="text-gray-600">Real-time WebSocket connection establishes on component mount.</p>
                 </div>
            </div>

            {/* Bottom Panel: Positions & Orders */}
            <div className="h-1/3 bg-[#15171e] flex flex-col">
                <div className="flex border-b border-[#333]">
                    <button className="px-6 py-3 text-sm font-bold text-yellow-500 border-b-2 border-yellow-500 bg-[#333]/20">Positions (0)</button>
                    <button className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-300">Open Orders (2)</button>
                    <button className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-300">History</button>
                    <button className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-300">Trades</button>
                </div>
                <div className="flex-1 flex items-center justify-center text-gray-500 text-xs gap-2">
                    <BookOpen size={16}/>
                    No open positions
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: Orderbook & Execution */}
        <div className="w-[320px] bg-[#15171e] flex flex-col">
            
            {/* Order Book */}
            <div className="flex-1 border-b border-[#333] flex flex-col">
                <div className="p-3 border-b border-[#333] text-gray-400 text-xs font-bold uppercase flex justify-between">
                    <span>Price</span>
                    <span>Size (ETH)</span>
                </div>
                <div className="flex-1 overflow-hidden font-mono text-xs">
                    {/* Asks (Sell Orders) */}
                    <div className="flex flex-col-reverse h-1/2 justify-end pb-1">
                         {ASKS.map((ask, i) => (
                             <div key={i} className="flex justify-between px-3 py-0.5 hover:bg-[#333]/50 cursor-pointer text-red-400 relative">
                                 <span className="z-10">{ask.price.toFixed(2)}</span>
                                 <span className="z-10 text-gray-400">{ask.size}</span>
                                 <div className="absolute right-0 top-0 bottom-0 bg-red-900/10" style={{ width: `${Math.random() * 100}%`}}></div>
                             </div>
                         ))}
                    </div>
                    
                    {/* Spread Info */}
                    <div className="py-2 text-center border-y border-[#333] text-lg font-bold text-white bg-[#0b0e11] flex items-center justify-center gap-2">
                        2,845.50 <ArrowUpRight size={16} className="text-green-500"/>
                    </div>

                    {/* Bids (Buy Orders) */}
                    <div className="flex flex-col h-1/2 pt-1">
                         {BIDS.map((bid, i) => (
                             <div key={i} className="flex justify-between px-3 py-0.5 hover:bg-[#333]/50 cursor-pointer text-green-400 relative">
                                 <span className="z-10">{bid.price.toFixed(2)}</span>
                                 <span className="z-10 text-gray-400">{bid.size}</span>
                                 <div className="absolute right-0 top-0 bottom-0 bg-green-900/10" style={{ width: `${Math.random() * 100}%`}}></div>
                             </div>
                         ))}
                    </div>
                </div>
            </div>

            {/* Execution Panel using Session Balance */}
            <div className="p-4 bg-[#1e2329]">
                <div className="flex bg-[#2a2d35] p-1 rounded-lg mb-4">
                    <button 
                        onClick={() => setOrderType('LIMIT')}
                        className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${orderType === 'LIMIT' ? 'bg-[#363a45] text-white shadow' : 'text-gray-500'}`}
                    >
                        Limit
                    </button>
                    <button 
                        onClick={() => setOrderType('MARKET')}
                        className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${orderType === 'MARKET' ? 'bg-[#363a45] text-white shadow' : 'text-gray-500'}`}
                    >
                        Market
                    </button>
                    <button className="flex-1 text-xs font-bold py-1.5 rounded-md text-gray-500">Stop</button>
                </div>

                <div className="flex gap-2 mb-4">
                    <button 
                        onClick={() => setSide('BUY')}
                        className={`flex-1 py-2 font-bold text-sm rounded transition-all ${side === 'BUY' ? 'bg-green-600 text-white' : 'bg-[#2a2d35] text-gray-400'}`}
                    >
                        Buy / Long
                    </button>
                    <button 
                        onClick={() => setSide('SELL')}
                        className={`flex-1 py-2 font-bold text-sm rounded transition-all ${side === 'SELL' ? 'bg-red-600 text-white' : 'bg-[#2a2d35] text-gray-400'}`}
                    >
                        Sell / Short
                    </button>
                </div>

                <div className="space-y-3 mb-4">
                    <div>
                        <label className="text-[10px] uppercase text-gray-500 font-bold">Price (USDC)</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={price} 
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full bg-[#15171e] border border-[#333] rounded p-2 text-right text-sm text-white font-mono focus:border-yellow-500 outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase text-gray-500 font-bold">Amount (ETH)</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-[#15171e] border border-[#333] rounded p-2 text-right text-sm text-white font-mono focus:border-yellow-500 outline-none"
                            />
                            <span className="absolute left-2 top-2 text-xs text-gray-500">ETH</span>
                        </div>
                    </div>
                    
                    <div className="flex justify-between text-xs pt-2">
                        <span className="text-gray-500">Avail Balance</span>
                        <span className="text-white font-mono">{balance.toFixed(4)} USDC</span>
                    </div>

                    <div className="bg-[#2a2d35] rounded p-2">
                         <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                             <span>Leverage</span>
                             <span className="text-yellow-500 font-bold">20x</span>
                         </div>
                         <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                             <div className="h-full bg-yellow-500 w-[20%]"></div>
                         </div>
                    </div>
                </div>

                <button className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition-transform active:scale-95 ${side === 'BUY' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}>
                    {side === 'BUY' ? 'Buy / Long ETH' : 'Sell / Short ETH'}
                </button>
            </div>

        </div>
      </div>
    </Modal>
  );
}
