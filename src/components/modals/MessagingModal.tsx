import { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { Search, User, Loader2, ShieldCheck, Lock, Send, ScanFace } from 'lucide-react';
import { useSession } from '../../context/SessionContext';
import { messagingService, type ChatMessage } from '../../services/messaging.service';
import { usePublicClient, useEnsName, useEnsAvatar, useAccount } from 'wagmi';
import { normalize } from 'viem/ens';
import { CONTRACTS } from '../../config/constants';

interface MessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Conversation {
  peerAddress: string;
  peerEns?: string;
  lastMessage: string;
  timestamp: number;
  unreadCount: number;
}

// Subcomponent to handle ENS Avatar efficiently for each list item
const ConversationItem = ({ conv, isSelected, onSelect }: { conv: Conversation, isSelected: boolean, onSelect: () => void }) => {
    const { data: avatar } = useEnsAvatar({
        name: conv.peerEns || undefined,
        chainId: 1
    });

    const displayName = conv.peerEns || shortenAddress(conv.peerAddress);
    const displayAddress = conv.peerEns ? shortenAddress(conv.peerAddress) : '';

    return (
        <div 
            onClick={onSelect}
            className={`
                p-3 m-2 rounded-lg cursor-pointer transition-all border border-transparent
                ${isSelected
                    ? 'bg-yellow-500/10 border-yellow-500/30' 
                    : 'hover:bg-white/5 hover:border-white/5'
                }
            `}
        >
            <div className="flex items-center gap-3">
                <div className="relative">
                    {avatar ? (
                        <img src={avatar} alt="Avatar" className="w-10 h-10 rounded-full border border-yellow-500/50 object-cover" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-900 to-black border border-white/10 flex items-center justify-center font-mono text-xs text-indigo-300">
                            {conv.peerAddress.slice(2,4)}
                        </div>
                    )}
                    
                    {conv.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white border border-black">
                            {conv.unreadCount}
                        </div>
                    )}
                </div>
                <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center mb-0.5">
                        <div className="flex flex-col">
                            <span className={`text-sm font-bold truncate ${isSelected ? 'text-yellow-400' : 'text-gray-200'}`}>
                                {displayName}
                            </span>
                             {displayAddress && <span className="text-[10px] text-gray-500 font-mono">{displayAddress}</span>}
                        </div>

                        <span className="text-[10px] text-gray-600 self-start mt-1">
                            {new Date(conv.timestamp).toLocaleDateString([], {day:'2-digit', month:'2-digit'})}
                        </span>
                        </div>
                        <div className="text-xs text-gray-500 truncate pr-2 mt-1">
                            {conv.lastMessage}
                        </div>
                </div>
            </div>
        </div>
    );
};
// Helper moved outside to be accessible to subcomponent if needed, or kept inside if just used there.
// But as shortenAddress is defined inside main component, we need to pass it or redefine it. 
// Easier to just define it outside or pass formatted strings. 
// For this quick fix, I will redefine a simple version inside or assume it's available.
// Actually, `shortenAddress` is defined inside `MessagingModal`. 
// I'll make sure `ConversationItem` has access to what it needs.
const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;


export function MessagingModal({ isOpen, onClose }: MessagingModalProps) {
  const { sessionAccount, balance, addLog, isChannelOpen } = useSession(); // Añadido isChannelOpen
  const { address: mainAddress } = useAccount();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const publicClient = usePublicClient();
  
  const [conversations, setConversations] = useState<Conversation[]>([]); 
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{address: string, name?: string | null, avatar?: string | null} | null>(null);

  const [peerAddress, setPeerAddress] = useState<string | null>(null);

  // Manual override for ENS (from search results)
  const [manualPeerEns, setManualPeerEns] = useState<string | null>(null);

  // ENS for Main Wallet (Sender)
  const { data: myEnsName } = useEnsName({
    address: mainAddress,
    chainId: 1
  });
  
  // Use Wagmi hooks for current peer ENS
  const { data: hookPeerEnsName } = useEnsName({
    address: peerAddress as `0x${string}` | undefined,
    chainId: 1 
  });

  const peerEnsName = hookPeerEnsName || manualPeerEns;
  
  const { data: peerEnsAvatar } = useEnsAvatar({
    name: peerEnsName || undefined,
    chainId: 1
  });
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Helper: Shorten Address
  const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load Conversations List
  const loadConversations = useCallback(async () => {
    if (sessionAccount) {
        const list = await messagingService.getConversations(sessionAccount.address);
        // Map ConversationRaw to local Conversation interface
        const formattedList: Conversation[] = list.map(item => ({
            peerAddress: item.peerAddress,
            peerEns: item.peerEns,
            lastMessage: item.lastMessage || 'Nueva conversación',
            timestamp: item.timestamp || Date.now(),
            unreadCount: item.unreadCount
        }));
        setConversations(formattedList);
    }
  }, [sessionAccount]);

    // 1. Connect to Gateway & Load Data
    useEffect(() => {
      // REQUISITO: Verificar que sessionAccount y isChannelOpen son válidos
      if (sessionAccount && isChannelOpen) {
          console.log("🟢 Channel Open & Session Ready: Connecting to Messaging...");
          messagingService.connect(sessionAccount.address);
          
          // FORZAR CARGA INMEDIATA
          loadConversations(); 
          
          // Polling fallback - Reducido a 3s para mejor UX en demo
          const interval = setInterval(loadConversations, 3000); 
  
          messagingService.on('incomingMessage', () => {
               loadConversations();
          });
          return () => { 
              // console.log("🔴 Disconnecting Messaging..."); // Comentado para evitar log noise
              messagingService.off('incomingMessage'); 
              clearInterval(interval);
          }
      } else {
          // Si no hay canal abierto, asegurarnos de limpiar
          setConversations([]);
          setMessages([]);
      }
    }, [sessionAccount, isChannelOpen, loadConversations]); // Dependencia clave: isChannelOpen
  
    // 2. Select Conversation from list
    const handleSelectConversation = async (address: string, ensName?: string | null) => {
        setPeerAddress(address);
        if (ensName) {
            console.log("✅ ENS Seleccionado manualmente:", ensName);
            setManualPeerEns(ensName); 
        }
        else setManualPeerEns(null);

        setSearchResult(null); // Clear search result
        setSearchQuery('');    // Clear search query
        setMessages([]);  
        
        // Hooks (useEnsName/useEnsAvatar) handle the resolution automatically now
        // Load History
        if (sessionAccount) {
            const history = await messagingService.getHistory(sessionAccount.address, address);
            setMessages(history);
        }
    };
  
    // 3. Manual Search Logic
    const handleSearch = async () => {
      if (!searchQuery) return;
      setIsSearching(true);
      setSearchResult(null);
      try {
          let address = searchQuery;
          let name: string | null = null;
          let avatar: string | null = null;
  
          // ENS Resolution logic
          if (searchQuery.includes('.')) {
              const normalizedName = normalize(searchQuery);
              const resolved = await publicClient?.getEnsAddress({ name: normalizedName });
              if (resolved) {
                  address = resolved;
                  name = normalizedName;
                  try { 
                      const av = await publicClient?.getEnsAvatar({ name: normalizedName });
                      avatar = av || null; 
                  } catch(e) {
                      console.warn("Avatar fetch failed", e);
                  }
              }
          } 
          else if (searchQuery.startsWith('0x') && searchQuery.length === 42) {
               const resolvedName = await publicClient?.getEnsName({ address: searchQuery as `0x${string}` });
               if (resolvedName) {
                   name = resolvedName;
                   try { 
                        const av = await publicClient?.getEnsAvatar({ name: resolvedName });
                        avatar = av || null;
                   } catch (e) {
                        console.warn("Avatar fetch failed", e);
                   }
               }
          }
  
          if (address.startsWith('0x')) {
              console.log("Selecionado search result:", address);
              setSearchResult({ address, name, avatar: avatar || null });
          } else {
              alert("Usuario no encontrado.");
          }
  
      } catch (error) {
          console.error("ENS Error:", error);
      } finally {
          setIsSearching(false);
      }
    };

  // 4. Send Message Logic (Payment + State Channel)
  const handleSend = async () => {
    if (!newMessage.trim() || !sessionAccount || !peerAddress) return;
    setIsSending(true);
    const COST = 0.0001;

    if (balance < COST) {
        alert("Fondos insuficientes.");
        setIsSending(false);
        return;
    }

    try {
        const newBalance = balance - COST;
        const nonce = Date.now();
        
        const statePayload = {
            channelId: `0xCH_${sessionAccount.address.slice(2, 10)}`,
            nonce: nonce,
            userAddress: sessionAccount.address,
            serverAddress: CONTRACTS.ServerWallet,
            userBalance: String(Math.floor(newBalance * 1000000)),
            serverBalance: String(Math.floor(COST * 1000000)),
            signature: ""
        };

        const messageContent = `CHANNEL:${statePayload.channelId}|NONCE:${statePayload.nonce}|UBAL:${statePayload.userBalance}|SBAL:${statePayload.serverBalance}`;
        const signature = await sessionAccount.signMessage({ message: messageContent });
        statePayload.signature = signature;

        // Pass resolved ENS names if available
        console.log("📤 Sending ENS Data:", { sender: myEnsName, receiver: peerEnsName });
        await messagingService.sendMessage(
            peerAddress, 
            newMessage, 
            statePayload,
            myEnsName || undefined,
            peerEnsName || undefined
        );

        addLog("Mensaje Enviado", COST, signature);
        
        const localMsg: ChatMessage = {
            id: crypto.randomUUID(),
            from: sessionAccount.address.toLowerCase(),
            to: peerAddress.toLowerCase(),
            content: newMessage,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, localMsg]);
        setNewMessage('');
        
        // Wait for DB indexing
        setTimeout(() => loadConversations(), 800);
    } catch (error) {
        console.error("Error sending:", error);
    } finally {
        setIsSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yellow Messenger" className="max-w-5xl h-[700px] flex flex-col p-0 overflow-hidden border border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.15)]">
      
      <div className="flex h-full bg-black/80 backdrop-blur-xl">
        
        {/* SIDEBAR: Contacts / Search (Simplified) */}
        <div className="w-80 border-r border-white/10 flex flex-col bg-zinc-900/60">
            {/* Search Header */}
            <div className="p-4 border-b border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-yellow-500 tracking-widest uppercase">Chats</h3>
                    <div className="flex items-center gap-2">
                        <button onClick={loadConversations} className="text-gray-500 hover:text-white transition-colors p-1" title="Actualizar">
                             <Loader2 size={12} className={conversations.length === 0 ? "text-yellow-500" : ""} />
                        </button>
                        <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/30">{conversations.length} Activos</span>
                    </div>
                </div>
                
                <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                        <input 
                            type="text" 
                            placeholder="Buscar ENS..."
                            className="w-full bg-black/50 border border-white/10 rounded-md py-2.5 pl-3 pr-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <button 
                        onClick={handleSearch}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white p-2.5 rounded-md border border-white/10 transition-colors"
                    >
                         {isSearching ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                    </button>
                </div>
            </div>
            
            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Search Result Card */}
                {searchResult && (
                    <div 
                        onClick={() => handleSelectConversation(searchResult.address, searchResult.name)}
                        className="bg-zinc-800 border border-yellow-500/50 p-3 m-2 rounded-lg cursor-pointer transform hover:scale-[1.02] transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)] animate-in fade-in slide-in-from-top-2"
                    >
                        <div className="flex items-center gap-3">
                            {searchResult.avatar ? (
                                <img src={searchResult.avatar} alt="Avatar" className="w-10 h-10 rounded-full border border-yellow-500" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-yellow-500 text-black flex items-center justify-center font-bold">
                                    <User size={18} />
                                </div>
                            )}
                            <div>
                                <div className="text-sm font-bold text-white">{searchResult.name || "Usuario"}</div>
                                <div className="text-xs text-yellow-500 font-mono">{shortenAddress(searchResult.address)}</div>
                                <div className="text-[10px] text-gray-400 mt-1">Clic para chatear</div>
                            </div>
                        </div>
                    </div>
                )}

                {conversations.length === 0 && !searchResult ? (
                    <div className="p-6 text-center text-gray-500 text-xs">
                        No hay conversaciones recientes.
                        <br/>Busca un usuario para empezar.
                    </div>
                ) : (
                    conversations.map((conv, idx) => (
                        <ConversationItem 
                            key={idx}
                            conv={conv}
                            isSelected={peerAddress === conv.peerAddress}
                            onSelect={() => handleSelectConversation(conv.peerAddress, conv.peerEns)}
                        />
                    ))
                )}
            </div>

            <div className="mt-auto p-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <ShieldCheck size={12} className="text-yellow-500" />
                    <span>Conexión Segura</span>
                </div>
            </div>
        </div>

        {/* MAIN CHAT AREA */}
        <div className="flex-1 flex flex-col relative bg-[url('/grid.svg')] bg-repeat opacity-90">
            {/* Chat Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/20 pointer-events-none" />

            {/* Chat Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    {peerEnsAvatar ? (
                        <div className="relative">
                            <img src={peerEnsAvatar} alt="ENS" className="w-8 h-8 rounded-full border border-yellow-500/50" />
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-black rounded-full shadow-[0_0_8px_rgba(34,197,94,1)]"></div>
                        </div>
                    ) : (
                         <div className={`w-3 h-3 rounded-full ${peerAddress ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)]' : 'bg-red-500'}`} />
                    )}
                    
                    <span className="text-sm font-mono uppercase text-gray-300 tracking-wider">
                        {peerAddress ? `CONECTADO: ${peerEnsName || shortenAddress(peerAddress)}` : 'ESPERANDO CONEXIÓN...'}
                    </span>
                </div>
                {peerAddress && (
                    <button 
                        onClick={() => { setPeerAddress(null); setManualPeerEns(null); }}
                        className="text-sm hover:text-red-400 text-gray-400 transition-colors font-medium border border-white/10 px-3 py-1 rounded-md hover:border-red-500/50"
                    >
                        Terminar Sesión
                    </button>
                )}
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4 opacity-70">
                        <ScanFace size={64} className="text-yellow-500/30" />
                        <div className="text-center">
                            <p className="text-lg font-medium text-gray-400">Busca un perfil ENS para comenzar</p>
                            <p className="text-sm mt-2">Cada mensaje está criptográficamente firmado y verificado.</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = sessionAccount && msg.from.toLowerCase() === sessionAccount.address.toLowerCase();
                        return (
                            <div key={idx} className={`group flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`
                                        px-5 py-4 text-base relative shadow-xl
                                        ${isMe 
                                            ? 'bg-yellow-500 text-black font-medium rounded-2xl rounded-tr-sm' 
                                            : 'bg-zinc-800 text-gray-100 border border-white/10 rounded-2xl rounded-tl-sm'
                                        }
                                    `}>
                                        {msg.content}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5 opacity-70 text-xs">
                                        {isMe && <span className="text-yellow-500 font-mono font-bold">-$0.0001</span>}
                                        <span className="text-gray-400">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        {isMe && <div className="text-yellow-500"><ShieldCheck size={12} /></div>}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-5 bg-zinc-900/90 border-t border-white/10 backdrop-blur-md">
                <div className="relative flex items-center gap-3">
                    <div className="absolute left-4 text-gray-400">
                        <Lock size={16} />
                    </div>
                    <input 
                        type="text" 
                        placeholder={peerAddress ? "Escribe un mensaje cifrado..." : "Selecciona un contacto primero"}
                        className="w-full bg-black/60 border border-white/10 rounded-full py-4 pl-12 pr-14 text-base text-white focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder-gray-500"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={!peerAddress || isSending}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!peerAddress || isSending}
                        className={`
                            absolute right-2 p-3 rounded-full transition-all
                            ${!peerAddress || isSending 
                                ? 'bg-zinc-800 text-gray-600' 
                                : 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.5)] transform hover:scale-105 active:scale-95'
                            }
                        `}
                    >
                        {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    </button>
                </div>
                <div className="text-right mt-3">
                     <span className="text-xs text-gray-500 uppercase tracking-widest font-mono">
                        Yellow Meter OS v1.0 • Secure Channel Active
                     </span>
                </div>
            </div>

        </div>
      </div>
    </Modal>
  );
}
