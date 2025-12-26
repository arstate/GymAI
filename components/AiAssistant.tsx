
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, DailyDiet, DailyRoutine } from '../types';
import { askAiAssistant } from '../services/geminiService';
import { Send, X, Bot, User, Loader2, MessageCircleQuestion, Coffee, AlertCircle } from 'lucide-react';

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
    { 
      role: 'bot', 
      text: `Halo ${user.name.split(' ')[0]}! Ada kendala hari ini? Tadi habis makan mi instan? Atau ragu mau minum kopi? Tanyain aja, pelatih nggak bakal marah kok! 😉` 
    }
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

  const handleSend = async (customMsg?: string) => {
    const userMsg = customMsg || input.trim();
    if (!userMsg || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await askAiAssistant(user, currentDiet, currentRoutine, userMsg);
      setMessages(prev => [...prev, { role: 'bot', text: response }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'bot', text: "Waduh, koneksi ke gym pusat lagi gangguan. Coba lagi bentar ya!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    { text: "Tadi saya khilaf makan mi instan...", icon: <AlertCircle className="w-3 h-3" /> },
    { text: "Boleh minum kopi sebelum latihan?", icon: <Coffee className="w-3 h-3" /> },
    { text: "Lagi malas latihan, gimana ya?", icon: <Bot className="w-3 h-3" /> }
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg md:rounded-3xl shadow-2xl h-[95vh] md:h-[650px] flex flex-col animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-primary-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Konsultasi Pelatih AI</h3>
              <p className="text-[10px] opacity-80">Siap bantu atur strategi dietmu</p>
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
                  ? 'bg-primary-600 text-white rounded-tr-none shadow-lg shadow-primary-100' 
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
                <span className="text-xs text-gray-400 font-medium">Pelatih sedang mengetik...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length < 3 && !isLoading && (
          <div className="px-4 py-2 flex flex-wrap gap-2 bg-gray-50">
            {quickQuestions.map((q, idx) => (
              <button 
                key={idx}
                onClick={() => handleSend(q.text)}
                className="text-[10px] bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:bg-primary-50 hover:border-primary-200 transition flex items-center gap-1.5 text-gray-600 font-medium"
              >
                {q.icon} {q.text}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t bg-white">
          <div className="relative flex gap-2">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ketikan keluhan atau pertanyaan dietmu..."
              className="flex-1 pl-4 pr-12 py-3.5 border border-gray-100 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition text-sm"
            />
            <button 
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="bg-primary-600 text-white p-3.5 rounded-2xl hover:bg-primary-700 transition disabled:opacity-50 flex-shrink-0 shadow-lg shadow-primary-100"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-3">
             Jangan sungkan buat jujur, pelatih di sini buat bantu kamu sukses! 🚀
          </p>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
