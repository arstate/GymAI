
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, DailyDiet, DailyRoutine } from '../types';
import { askAiAssistant } from '../services/geminiService';
import { Send, X, Bot, User, Loader2, MessageCircleQuestion } from 'lucide-react';

interface Props {
  user: UserProfile;
  currentDiet: DailyDiet;
  currentRoutine: DailyRoutine;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'bot';
  text: string;
}

const AiAssistant: React.FC<Props> = ({ user, currentDiet, currentRoutine, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: `Halo ${user.name.split(' ')[0]}! Ada yang ingin ditanyakan tentang rencana hari ini? Atau mungkin ada 'cheat meal' yang mau dilaporkan? Saya siap bantu!` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await askAiAssistant(user, currentDiet, currentRoutine, userMsg);
      setMessages(prev => [...prev, { role: 'bot', text: response }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'bot', text: "Aduh, koneksi saya lagi bermasalah. Coba ulangi pertanyaannya ya!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg md:rounded-3xl shadow-2xl h-[90vh] md:h-[600px] flex flex-col animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-primary-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Asisten FitGenius</h3>
              <p className="text-[10px] opacity-80">Siap menjawab semua keluhanmu</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 md:p-4 rounded-2xl md:rounded-3xl flex gap-3 ${
                msg.role === 'user' 
                  ? 'bg-primary-600 text-white rounded-tr-none' 
                  : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-none'
              }`}>
                {msg.role === 'bot' && <Bot className="w-5 h-5 flex-shrink-0 mt-1 text-primary-500" />}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                {msg.role === 'user' && <User className="w-5 h-5 flex-shrink-0 mt-1" />}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                <span className="text-xs text-gray-400 font-medium">Sedang mengetik...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-white">
          <div className="relative flex gap-2">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Tanya: 'Habis makan mi instan, harus apa?'"
              className="flex-1 pl-4 pr-12 py-3 border border-gray-100 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition text-sm"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-primary-600 text-white p-3 rounded-xl hover:bg-primary-700 transition disabled:opacity-50 flex-shrink-0 shadow-lg shadow-primary-100"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-3">
             <MessageCircleQuestion className="w-3 h-3 inline mr-1" /> Tips: Ceritakan apa saja yang mengganggu dietmu hari ini.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
