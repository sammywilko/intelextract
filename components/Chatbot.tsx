
import React, { useState, useRef, useEffect } from 'react';
import { CompanyProfile, ChatMessage, AnalysisResult } from '../types';
import { createWorkspaceChat } from '../services/geminiService';

interface Props {
  profile: CompanyProfile;
  library: AnalysisResult[];
}

const Chatbot: React.FC<Props> = ({ profile, library }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current = createWorkspaceChat(profile);
  }, [profile]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    const relevantContext = library
      .slice(0, 10) 
      .map(p => {
        const primaryClient = p.clientRelevanceScores?.sort((a,b) => b.score - a.score)[0]?.clientName;
        return `[Pod: ${primaryClient || 'Global'}] Title: ${p.title}\nSummary: ${p.summary}`;
      })
      .join('\n\n');

    const messageWithContext = `
      INTELEXTRACT CORPORATE MEMORY:
      ${relevantContext}
      
      USER QUERY:
      ${userMsg}
      
      ACT AS: Channel Changers Intelligence Agent.
      Synthesize insights from corporate memory, focusing on AI video production and B2B workflows.
    `;

    try {
      const response = await chatRef.current.sendMessage({ message: messageWithContext });
      setMessages(prev => [...prev, { role: 'model', text: response.text || 'INTELEXTRACT Engine busy. Retry.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: 'Connection to Intel Engine lost.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-[#020617] rounded-[3rem] shadow-2xl border border-white/5 flex flex-col h-[700px] overflow-hidden">
      <div className="bg-slate-900 p-8 text-white flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#1a365d] border border-[#ed8936]/30 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
            <i className="fas fa-satellite-dish text-xl text-[#ed8936]"></i>
          </div>
          <div>
            <h3 className="font-black text-xl tracking-tight uppercase italic">Agent Console</h3>
            <p className="text-[10px] text-[#ed8936] font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#ed8936] rounded-full animate-pulse"></span>
              Synchronized to {library.length} Knowledge Pods
            </p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-6 bg-black/20 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center py-20 space-y-6 opacity-40">
            <i className="fas fa-terminal text-6xl text-slate-800"></i>
            <p className="text-slate-500 text-lg font-medium max-w-sm mx-auto">Query Channel Changers memory. Ask about premium AI video trends, client strategy gaps, or B2B workflow automation.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-6 rounded-[2rem] text-sm leading-relaxed ${
              m.role === 'user' 
                ? 'bg-[#ed8936] text-white rounded-tr-none shadow-xl' 
                : 'bg-slate-900 border border-white/5 text-slate-300 rounded-tl-none shadow-inner'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-900 border border-white/5 p-6 rounded-[2rem] rounded-tl-none">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-[#ed8936] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#ed8936] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-[#ed8936] rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-8 border-t border-white/5 bg-slate-900/50 flex gap-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Query Channel Changers intelligence..."
          className="flex-1 px-8 py-4 bg-black/40 border border-white/10 rounded-2xl focus:ring-4 focus:ring-[#ed8936]/30 outline-none text-slate-200 font-medium"
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="w-14 h-14 bg-[#ed8936] text-white rounded-2xl flex items-center justify-center hover:bg-[#dd7926] transition-all shadow-xl shadow-[#ed8936]/20 disabled:opacity-50"
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
