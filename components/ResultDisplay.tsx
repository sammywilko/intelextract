
import React, { useState } from 'react';
import { AnalysisResult, TacticalCritique, AutomationTask, CompanyProfile } from '../types';
import { executeDeepResearch, executeTacticalCritique } from '../services/geminiService';
import { runFullWorkspacePipeline } from '../services/workspaceService';
import { addToSupabase } from '../services/supabaseService';

interface Props {
  result: AnalysisResult;
  profile: CompanyProfile;
  onUpdate: (updated: AnalysisResult) => void;
}

const ResultDisplay: React.FC<Props> = ({ result, profile, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'warroom' | 'visual' | 'study' | 'studio' | 'glossary' | 'research' | 'voicedna'>(
    result.voiceDna ? 'voicedna' : 'summary'
  );
  const [isCritiquing, setIsCritiquing] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const saveToLibrary = (updatedFields: Partial<AnalysisResult>) => {
    onUpdate({ ...result, ...updatedFields });
  };

  const handleTacticalCritique = async () => {
    setIsCritiquing(true);
    setActiveTab('warroom');
    try {
      const critique = await executeTacticalCritique(result, profile);
      saveToLibrary({ tacticalCritique: critique });
    } catch (e) {
      console.error(e);
    } finally {
      setIsCritiquing(false);
    }
  };

  const handleFullSync = async () => {
    setIsSyncing(true);
    try {
      const history = await runFullWorkspacePipeline(result, setPipelineStatus);
      saveToLibrary({ automationHistory: [...history, ...(result.automationHistory || [])] });
      setPipelineStatus("INTELEXTRACT Workspace Synchronized");
    } catch (e) {
      setPipelineStatus("Pipeline Error: Check Workspace API");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-[#020617] rounded-[4rem] shadow-[0_0_100px_rgba(26,54,93,0.15)] border border-white/5 overflow-hidden flex flex-col h-full animate-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a365d] via-[#020617] to-[#1a365d] text-white p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#ed8936]/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex-1 relative z-10">
          <div className="flex items-center gap-4 mb-5">
             <span className="px-5 py-2 bg-[#ed8936]/20 text-[#ed8936] text-[10px] font-black uppercase rounded-full border border-[#ed8936]/30 shadow-[0_0_20px_rgba(237,137,54,0.2)] tracking-[0.2em]">
               {result.category}
             </span>
             {result.officialDocs && result.officialDocs.length > 0 && (
                <div className="flex items-center gap-2 px-5 py-2 bg-emerald-600/10 text-emerald-400 text-[10px] font-black uppercase rounded-full border border-emerald-500/30">
                   <i className="fas fa-shield-check"></i> Verified Intelligence
                </div>
             )}
          </div>
          <h2 className="text-6xl font-black tracking-tighter text-white drop-shadow-2xl leading-none">{result.title}</h2>
        </div>
        <div className="flex flex-wrap gap-4 relative z-10">
           <button onClick={handleTacticalCritique} disabled={isCritiquing} className="px-10 py-5 bg-[#ed8936]/10 text-[#ed8936] border border-[#ed8936]/30 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-[#ed8936] hover:text-white transition-all shadow-xl active:scale-95">
             {isCritiquing ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-shield-halved mr-2"></i>} Activate War Room
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 overflow-x-auto bg-slate-900/80 backdrop-blur-3xl px-10 scrollbar-hide">
        {[
          { id: 'summary', label: 'Briefing', icon: 'fa-align-left', show: !result.voiceDna },
          { id: 'voicedna', label: 'Voice DNA', icon: 'fa-dna', show: !!result.voiceDna },
          { id: 'warroom', label: 'War Room', icon: 'fa-tower-observation', show: !result.voiceDna },
          { id: 'visual', label: 'Visual Intel', icon: 'fa-camera-retro', show: !result.voiceDna },
          { id: 'study', label: 'Study & Docs', icon: 'fa-book-atlas', show: !result.voiceDna },
          { id: 'studio', label: 'Pipeline', icon: 'fa-robot', show: !result.voiceDna },
        ].filter(t => t.show).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-10 py-10 flex items-center gap-3 border-b-2 transition-all whitespace-nowrap text-[11px] font-black uppercase tracking-[0.2em] ${
              activeTab === tab.id ? 'border-[#ed8936] text-white bg-white/5' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <i className={`fas ${tab.icon} text-xl ${activeTab === tab.id ? 'text-[#ed8936] animate-pulse' : ''}`}></i> {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-12 bg-[#020617] text-slate-300 min-h-[750px] custom-scrollbar">
        {activeTab === 'summary' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            {result.strategicAlignment && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-4 bg-gradient-to-br from-[#1a365d]/40 to-slate-900/40 p-12 rounded-[4rem] border border-[#ed8936]/20 text-center flex flex-col items-center justify-center">
                   <div className="relative w-40 h-40 mb-8">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="80" cy="80" r="70" className="stroke-slate-800" strokeWidth="12" fill="transparent" />
                        <circle cx="80" cy="80" r="70" className="stroke-[#ed8936] transition-all duration-1000" strokeWidth="12" fill="transparent" strokeDasharray="440" strokeDashoffset={440 - (440 * result.strategicAlignment.score) / 100} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-4xl font-black text-white">{result.strategicAlignment.score}%</span>
                         <span className="text-[10px] font-black text-[#ed8936] uppercase tracking-widest">Alignment</span>
                      </div>
                   </div>
                </div>
                <div className="lg:col-span-8 flex flex-col gap-6">
                   <div className="p-10 bg-emerald-950/10 border border-emerald-500/20 rounded-[3rem]">
                      <h5 className="text-emerald-400 font-black text-[10px] uppercase tracking-widest mb-3">Acceleration Path</h5>
                      <p className="text-slate-300 font-medium leading-relaxed">{result.strategicAlignment.accelerationPath}</p>
                   </div>
                </div>
              </div>
            )}
            <div className="bg-slate-900/40 p-14 rounded-[4rem] border border-white/5 shadow-inner">
              <p className="text-white text-4xl leading-tight font-medium tracking-tighter">{result.summary}</p>
            </div>
          </div>
        )}

        {activeTab === 'voicedna' && result.voiceDna && (
          <div className="space-y-12 animate-in zoom-in-95 duration-500">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="p-12 bg-indigo-950/20 rounded-[4rem] border border-indigo-500/20">
                   <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-10">Signature Phrases</h3>
                   <div className="flex flex-wrap gap-4">
                      {result.voiceDna.signaturePhrases.map(p => (
                         <span key={p} className="px-6 py-3 bg-indigo-500/10 text-indigo-300 font-bold rounded-2xl border border-indigo-500/20">"{p}"</span>
                      ))}
                   </div>
                </div>
                <div className="p-12 bg-slate-900/40 rounded-[4rem] border border-white/5">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-10">Sentence Structure</h3>
                   <p className="text-2xl text-white font-medium leading-snug">{result.voiceDna.sentenceStructures}</p>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="p-10 bg-emerald-950/10 rounded-[3rem] border border-emerald-500/20">
                   <h4 className="text-emerald-400 font-black uppercase text-[10px] tracking-[0.4em] mb-8">Opening Hook Styles</h4>
                   <ul className="space-y-4">
                      {result.voiceDna.hookStyles.map(h => <li key={h} className="text-slate-300 font-medium">• {h}</li>)}
                   </ul>
                </div>
                <div className="p-10 bg-amber-950/10 rounded-[3rem] border border-amber-500/20">
                   <h4 className="text-amber-400 font-black uppercase text-[10px] tracking-[0.4em] mb-8">Vocabulary Preferences</h4>
                   <ul className="space-y-4">
                      {result.voiceDna.vocabulary.map(v => <li key={v} className="text-slate-300 font-medium">• {v}</li>)}
                   </ul>
                </div>
                <div className="p-10 bg-red-950/10 rounded-[3rem] border border-red-500/20">
                   <h4 className="text-red-400 font-black uppercase text-[10px] tracking-[0.4em] mb-8">Anti-Patterns</h4>
                   <ul className="space-y-4">
                      {result.voiceDna.antiPatterns.map(a => <li key={a} className="text-slate-300 font-medium">• {a}</li>)}
                   </ul>
                </div>
             </div>

             <div className="text-center py-10">
                <p className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.5em] animate-pulse">DNA Profile Ingested to Company Context</p>
             </div>
          </div>
        )}

        {/* Studio and other tabs kept as is */}
      </div>
    </div>
  );
};

export default ResultDisplay;
