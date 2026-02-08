import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Modal } from '../ui/Modal';
import { useSession } from '../../context/SessionContext';
import { Send, Bot, Cpu, ChevronDown, Check, Settings2, Loader2 } from 'lucide-react';
import { aiService } from '../../services/ai.service';

interface AiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}


interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

interface AiModel {
  id: string;
  name: string;
  cost: number;
  provider?: string;
  isNew?: boolean;
}

interface ModelGroup {
    title?: string;
    items: AiModel[];
}

// Grouped models configuration mimicking the screenshot
const MODEL_GROUPS: ModelGroup[] = [
  {
    title: 'AI MODEL',
    items: [
      { id: 'auto', name: 'Auto (Best)', cost: 0.02, provider: 'Yellow' } // 10% discount implied
    ]
  },
  {
    items: [
      { id: 'gpt-4.1', name: 'GPT-4.1', cost: 0.04 },
      { id: 'gpt-4o', name: 'GPT-4o', cost: 0.03 },
      { id: 'gpt-5-mini', name: 'GPT-5 mini', cost: 0.02 },
      { id: 'grok-code', name: 'Grok Code Fast 1', cost: 0.01 },
      { id: 'raptor-mini', name: 'Raptor mini (Preview)', cost: 0.01 }
    ]
  },
  {
    items: [
      { id: 'claude-haiku-4.5', name: 'Claude Haiku 4.5', cost: 0.01 },
      { id: 'claude-opus-4.5', name: 'Claude Opus 4.5', cost: 0.09 },
      { id: 'claude-opus-4.6', name: 'Claude Opus 4.6', cost: 0.09 },
      { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', cost: 0.03 },
      { id: 'claude-sonnet-4.5', name: 'Claude Sonnet 4.5', cost: 0.03 }
    ]
  },
  {
    items: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', cost: 0.03 },
      { id: 'gemini-3-flash', name: 'Gemini 3 Flash (Preview)', cost: 0.01 },
      { id: 'gemini-3-pro', name: 'Gemini 3 Pro (Preview)', cost: 0.03 }
    ]
  },
  {
    items: [
      { id: 'gpt-5', name: 'GPT-5', cost: 0.10, isNew: true },
      { id: 'gpt-5-codex', name: 'GPT-5-Codex (Preview)', cost: 0.10, isNew: true },
      { id: 'gpt-5.1', name: 'GPT-5.1', cost: 0.12 },
      { id: 'gpt-5.1-codex', name: 'GPT-5.1-Codex', cost: 0.12 },
    ]
  }
];

// Flatten for easier searching/default selection
const ALL_MODELS = MODEL_GROUPS.flatMap(g => g.items);

export function AiChatModal({ isOpen, onClose }: AiChatModalProps) {
  const { addLog, balance, actionsCount, sessionAccount } = useSession();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'bot', text: 'Hi, I am YellowBot. Pay-per-use to chat with me.' }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedModel, setSelectedModel] = useState(ALL_MODELS.find(m => m.id === 'gemini-3-pro') || ALL_MODELS[0]);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const isConnected = !!sessionAccount;
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isThinking]);

  // Click outside to close menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setIsModelMenuOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



  /**
   * 💬 ENVIAR MENSAJE A IA
   */
  const handleSend = async () => {
    if (!inputText.trim() || isThinking) return;

    if (!sessionAccount) {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: 'bot',
            text: '⚠️ No Active Channel. Please Deposit and Open Channel first.'
        }]);
        return;
    }

    // 1. Add User Message
    const userText = inputText;
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);
    
    try {
        // 2. Call AI Service (Sign & Pay & Inference)
        const response = await aiService.requestInference(userText, sessionAccount);
        
        // 3. Add Bot Response
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: response.result
        };
        setMessages(prev => [...prev, botMsg]);

        // 4. Log Payment
        addLog(`AI_QUERY: ${selectedModel.id}`, selectedModel.cost, response.newServerSignature.slice(0, 10)); // Use real signature from server

    } catch (error: any) {
        console.error("AI Error:", error);
         const errorMsg: Message = {
            id: Date.now().toString(),
            sender: 'bot',
            text: `❌ Error: ${error.message || 'Service unavailable'}`
        };
        setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  /**
   * 🔒 CLOSE MODAL (Session remains active in background)
   */
  function handleCloseSession() {
      onClose();
  }

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={handleCloseSession} 
        title="AI Chat Gateway - Yellow Network" 
        className="max-w-4xl"
    >
      {/* Header Status */}
      <div className="flex items-center justify-between mb-4 px-1 border-b border-white/5 pb-4">
        {/* Real-time Stats */}
        <div className="flex gap-6">
            <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Real Balance</span>
                <span className="text-white font-mono font-bold text-sm">{balance.toFixed(4)} USDC</span>
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Signatures</span>
                <span className="text-yellow-500 font-mono font-bold text-sm">{actionsCount}</span>
            </div>
        </div>

        <div className={`text-xs font-mono flex items-center gap-2 px-3 py-1.5 rounded-md ${
          isConnected 
            ? 'bg-green-500/10 text-green-500 border border-green-500/30' 
            : 'bg-gray-500/10 text-gray-500 border border-gray-500/30'
        }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
            {isConnected ? 'CHANNEL OPEN' : 'CONNECTING...'}
        </div>
      </div>

      {/* Chat Area */}
      <div className="bg-[#0a0c10] border border-white/5 rounded-xl h-[600px] flex flex-col mb-4 shadow-inner">
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
            {messages.map((msg) => (
                <div 
                    key={msg.id} 
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    <div 
                        className={`max-w-[85%] rounded-2xl p-4 text-sm ${
                            msg.sender === 'user' 
                                ? 'bg-[#EEEEEE] text-gray-900 rounded-br-none shadow-md' 
                                : 'bg-[#161b22] border border-white/10 text-gray-300 rounded-bl-none shadow-md'
                        }`}
                    >
                        {msg.sender === 'bot' && (
                            <div className="flex items-center gap-2 mb-2 text-xs text-yellow-500 font-bold uppercase tracking-wider border-b border-white/5 pb-1">
                                <Bot size={12} />
                                YellowBot
                            </div>
                        )}
                        <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-code:text-yellow-200 prose-a:text-yellow-400">
                             <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.text}
                             </ReactMarkdown>
                        </div>
                    </div>
                </div>
            ))}
            {isThinking && (
                 <div className="flex justify-start">
                    <div className="bg-[#1a1d24] border border-yellow-500/20 text-gray-200 rounded-2xl rounded-bl-none p-3 text-sm flex items-center gap-2">
                        <Loader2 size={12} className="text-yellow-500 animate-spin" />
                        <span className="text-gray-400 text-xs">Processing with {selectedModel.name}...</span>
                    </div>
                 </div>
            )}

            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/5 bg-[#0a0c10]">
            <div className="flex gap-2 mb-3">
                 <div className="relative" ref={menuRef}>
                    <button 
                        onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                        className="flex items-center gap-2 bg-[#1a1d24] hover:bg-[#252830] transition-colors px-3 py-2 rounded-lg border border-white/10 text-sm text-gray-300 w-full md:w-auto justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <Cpu size={16} className="text-yellow-500" />
                            <span className="truncate max-w-[100px]">{selectedModel.name}</span>
                        </div>
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isModelMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isModelMenuOpen && (
                        <div className="absolute bottom-full left-0 mb-2 w-72 bg-[#1e2329] border border-[#30363d] rounded-lg shadow-2xl z-[100] max-h-[300px] overflow-y-auto custom-scrollbar">
                            {MODEL_GROUPS.map((group, groupIndex) => (
                                <div key={groupIndex}>
                                    {group.title && (
                                        <div className="px-3 py-2 text-xs font-semibold text-gray-400 flex justify-between uppercase tracking-wider bg-[#161b22]">
                                            <span>{group.title}</span>
                                            {group.title === 'Auto' && <span className="text-green-400">10% discount</span>}
                                        </div>
                                    )}
                                    {group.items.map((model) => {
                                        const isSelected = model.id === selectedModel.id;
                                        return (
                                        <button
                                            key={model.id}
                                            onClick={() => {
                                                setSelectedModel(model);
                                                setIsModelMenuOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 text-[13px] flex items-center justify-between group transition-colors
                                                ${isSelected ? 'bg-[#093aa4] text-white' : 'text-gray-300 hover:bg-[#2c323a]'}
                                            `}
                                        >
                                            <div className="flex items-center gap-2">
                                                {isSelected && <Check size={14} className="text-white" />}
                                                <span className={isSelected ? 'ml-0' : 'ml-6'}>{model.name}</span>
                                            </div>
                                            <span className={`text-[11px] opacity-60 font-mono ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                                                ${model.cost}
                                            </span>
                                        </button>
                                        );
                                    })}
                                    {groupIndex < MODEL_GROUPS.length - 1 && (
                                        <div className="border-b border-[#30363d] my-1 mx-2" />
                                    )}
                                </div>
                            ))}
                            <button className="w-full text-left px-4 py-3 text-xs text-blue-400 hover:text-blue-300 hover:bg-[#2c323a] border-t border-[#30363d] flex items-center gap-2">
                                <span>Manage Models...</span>
                                <Settings2 size={12} />
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="relative flex-grow">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your query..."
                        className="w-full bg-[#15171e] text-white border border-white/10 rounded-lg pl-4 pr-32 py-2 text-sm focus:outline-none focus:border-yellow-500/50 transition-colors placeholder-gray-600 h-full"
                    />
                    
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-gray-400 text-[10px] px-2 py-1 rounded border border-white/5">
                        {selectedModel.cost} USDC
                    </div>
                </div>
            </div>
             <button
                    onClick={handleSend}
                    disabled={!isConnected || isThinking || !inputText.trim()}
                    className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-yellow-400"
                >
                    {isThinking ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>Send</span>
                        <Send size={16} />
                      </>
                    )}
                </button>
        </div>
      </div>
    </Modal>
  );
}
