
import React, { useState } from 'react';
import { AnalysisResult, ClientProfile } from '../types';

interface Props {
  library: AnalysisResult[];
  clients: ClientProfile[];
  onSelect: (item: AnalysisResult) => void;
  onDelete: (id: string) => void;
}

const WorkspaceDrive: React.FC<Props> = ({ library, clients, onSelect, onDelete }) => {
  const [activeClient, setActiveClient] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = library.filter(item => {
    // Filter by client if one is selected
    const matchesClient = activeClient 
      ? item.clientRelevanceScores?.some(s => s.clientName === activeClient && s.score > 20)
      : true;
      
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      item.title.toLowerCase().includes(q) || 
      item.summary.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);
    
    return matchesClient && matchesSearch;
  });

  return (
    <div className="flex flex-col md:flex-row gap-12 h-full animate-in fade-in duration-700">
      {/* Sidebar: Client Knowledge Pods */}
      <div className="w-full md:w-80 space-y-3">
        <button 
          onClick={() => setActiveClient(null)}
          className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${!activeClient ? 'bg-[#ed8936] text-white shadow-2xl shadow-[#ed8936]/30' : 'hover:bg-white/5 text-slate-500'}`}
        >
          <i className="fas fa-th-large text-lg"></i> Global Intelligence
        </button>
        
        <div className="pt-8 pb-3 px-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Corporate Memory</div>
        
        {clients.map(client => (
          <button 
            key={client.name}
            onClick={() => setActiveClient(client.name)}
            className={`w-full flex flex-col items-start gap-1 px-6 py-5 rounded-2xl transition-all ${activeClient === client.name ? 'bg-[#1a365d] text-white shadow-lg border border-[#ed8936]/20' : 'hover:bg-white/5 text-slate-500'}`}
          >
            <span className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
               <i className={`fas fa-cube ${activeClient === client.name ? 'text-[#ed8936]' : 'text-[#ed8936]/60'}`}></i>
               {client.name}
            </span>
            <span className="text-[9px] opacity-40 uppercase tracking-tighter pl-6">{client.industry}</span>
          </button>
        ))}

        <div className="mt-8 p-6 bg-[#ed8936]/10 border border-[#ed8936]/10 rounded-3xl">
           <p className="text-[9px] font-black text-[#ed8936] uppercase tracking-widest mb-2">INTELEXTRACT Pods</p>
           <p className="text-xs text-slate-400 leading-relaxed">Aggregated meeting intelligence, technical research, and premium video scouting for Channel Changers B2B workflows.</p>
        </div>
      </div>

      {/* Main Drive View */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="mb-10 flex gap-6">
          <div className="relative flex-1 group">
            <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#ed8936] transition-colors"></i>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-slate-900 border border-white/5 rounded-3xl text-sm font-bold focus:ring-8 focus:ring-[#ed8936]/30 outline-none shadow-2xl transition-all placeholder:text-slate-700 text-white" 
              placeholder={activeClient ? `Search within ${activeClient} pod...` : "Search global INTELEXTRACT memory..."} 
            />
          </div>
        </div>

        <div className="flex-1 bg-black/40 rounded-[4rem] border border-white/5 p-12 overflow-y-auto custom-scrollbar shadow-inner">
          {filteredItems.length === 0 ? (
            <div className="py-32 text-center space-y-6">
              <i className="fas fa-box-open text-7xl text-slate-900"></i>
              <p className="text-slate-600 font-black uppercase tracking-widest">Pod is empty. Run ingestion lab to populate.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredItems.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => onSelect(item)}
                  className="group p-8 rounded-[2.5rem] border border-white/5 bg-slate-900/50 hover:bg-slate-900 hover:border-[#ed8936]/50 hover:shadow-[0_0_50px_rgba(237,137,54,0.1)] hover:-translate-y-2 transition-all cursor-pointer relative flex flex-col h-80"
                >
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                      className="w-10 h-10 bg-slate-800 border border-white/5 rounded-full flex items-center justify-center text-slate-500 hover:text-red-500"
                    >
                      <i className="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                  <div className={`w-14 h-14 ${item.isHighRelevance ? 'bg-[#ed8936] text-white' : 'bg-[#1a365d]/30 text-[#ed8936] border border-[#ed8936]/20'} rounded-2xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-all shadow-lg`}>
                    <i className={item.isHighRelevance ? 'fas fa-bolt' : 'fas fa-microchip'}></i>
                  </div>
                  <h4 className="font-black text-white text-xl mb-3 truncate pr-10 tracking-tight">{item.title}</h4>
                  <p className="text-slate-500 text-xs line-clamp-4 mb-6 font-medium leading-relaxed">{item.summary}</p>
                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                     <span className="text-[9px] font-black text-[#ed8936] uppercase tracking-widest">{item.category}</span>
                     <span className="text-[9px] font-mono text-slate-700">{new Date(item.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceDrive;
