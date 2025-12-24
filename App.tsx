
import React, { useState, useEffect } from 'react';
import { CompanyProfile, AnalysisResult, AnalysisStage } from './types';
import { analyzeTranscript } from './services/geminiService';
import { getLibrary, saveToLibrary, deleteFromLibrary } from './services/supabaseService';
import { initGoogleAuth, promptGoogleLogin, UserProfile, signOut, MOCK_USER } from './services/authService';
import CompanyProfileEditor from './components/CompanyProfileEditor';
import ResultDisplay from './components/ResultDisplay';
import WorkspaceDrive from './components/WorkspaceDrive';
import Chatbot from './components/Chatbot';

type ViewMode = 'analyze' | 'pods' | 'chat';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('analyze');
  const [isCompetitorMode, setIsCompetitorMode] = useState(false);
  const [isVoiceDnaMode, setIsVoiceDnaMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<boolean | null>(null);
  
  const [profile, setProfile] = useState<CompanyProfile>(() => {
    const saved = localStorage.getItem('cc_profile');
    if (saved) return JSON.parse(saved);
    return {
      name: 'Channel Changers',
      industry: 'Premium AI Video Production',
      focus: 'Enterprise B2B Video Intelligence & Automation',
      goals: 'Build comprehensive business automation via CC Command Center; Establish premium AI video production category leadership; Scale through systematic knowledge capture and agent workflows',
      clientProfiles: [
        { name: 'Darwinium', industry: 'CYBERSECURITY AI PLATFORM' },
        { name: 'EY', industry: 'ENTERPRISE INTERNAL COMMUNICATIONS' },
        { name: '3Fold', industry: 'ENERGY TECH / BATTERY STORAGE' },
        { name: 'Under Armour', industry: 'SPORT FASHION / RETAIL' },
        { name: 'Botivo', industry: 'PREMIUM BEVERAGES' }
      ]
    };
  });

  const [inputText, setInputText] = useState('');
  const [stage, setStage] = useState<AnalysisStage>(AnalysisStage.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [library, setLibrary] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('cc_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    initGoogleAuth((u) => {
      setUser(u);
      localStorage.setItem('cc_user_session', JSON.stringify(u));
    });
    
    const savedSession = localStorage.getItem('cc_user_session');
    if (savedSession) setUser(JSON.parse(savedSession));
    
    getLibrary().then(setLibrary);
  }, []);

  const handleProcess = async () => {
    if (!inputText.trim()) return;
    setStage(AnalysisStage.EXTRACTING);
    setError(null);
    setSyncStatus(null);
    try {
      const data = await analyzeTranscript(inputText, profile, isCompetitorMode, isVoiceDnaMode);
      setResult(data);
      
      // If Voice DNA mode, update company profile with the new profile
      if (isVoiceDnaMode && data.voiceDna) {
        setProfile(prev => ({
          ...prev,
          voiceProfile: {
            ...data.voiceDna!,
            lastUpdated: new Date().toISOString()
          }
        }));
      }

      const { updated, synced } = await saveToLibrary(data);
      setLibrary(updated);
      setSyncStatus(synced);
      setStage(AnalysisStage.COMPLETED);
    } catch (err: any) {
      setError(err.message || 'Intelligence extraction failed.');
      setStage(AnalysisStage.ERROR);
    }
  };

  const handleUpdateResult = (updated: AnalysisResult) => {
    const updatedLib = library.map(item => item.id === updated.id ? updated : item);
    localStorage.setItem('intel_extract_library', JSON.stringify(updatedLib));
    setLibrary(updatedLib);
    setResult(updated);
  };

  const handleSelectFromLibrary = (item: AnalysisResult) => {
    setResult(item);
    setStage(AnalysisStage.COMPLETED);
    setViewMode('analyze');
  };

  const handleDelete = async (id: string) => {
    const updatedLib = await deleteFromLibrary(id);
    setLibrary(updatedLib);
    if (result?.id === id) {
      setResult(null);
      setStage(AnalysisStage.IDLE);
    }
  };

  const handleBypassLogin = () => {
    setUser(MOCK_USER);
    localStorage.setItem('cc_user_session', JSON.stringify(MOCK_USER));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(26,54,93,0.1),transparent_50%)]"></div>
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#1a365d]/10 blur-[100px] rounded-full"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#ed8936]/10 blur-[100px] rounded-full"></div>

        <div className="max-w-xl w-full bg-slate-900/40 backdrop-blur-3xl p-16 rounded-[4rem] border border-white/5 shadow-2xl text-center relative z-10 animate-in zoom-in-95 duration-700">
           <div className="w-24 h-24 bg-[#1a365d] rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-[0_0_50px_rgba(26,54,93,0.4)] border border-[#ed8936]/30 transition-all hover:scale-110">
              <i className="fas fa-radar text-4xl text-[#ed8936]"></i>
           </div>
           <h1 className="text-5xl font-black text-white tracking-tighter mb-2 leading-none uppercase italic">INTEL<span className="text-[#ed8936]">EXTRACT</span></h1>
           <p className="text-slate-500 text-sm font-black uppercase tracking-widest mb-12">Premium Video Production Intelligence</p>
           
           <div className="space-y-4">
              <button onClick={() => promptGoogleLogin()} className="w-full py-6 bg-white text-slate-950 rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-slate-200 transition-all shadow-xl active:scale-95">
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="G" />
                Secure Login via Google
              </button>
              <div className="flex items-center gap-4 my-8"><div className="h-px bg-white/5 flex-1"></div><span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">or</span><div className="h-px bg-white/5 flex-1"></div></div>
              <button onClick={handleBypassLogin} className="w-full py-5 bg-[#ed8936]/10 text-[#ed8936] border border-[#ed8936]/20 rounded-3xl font-black uppercase tracking-widest hover:bg-[#ed8936] hover:text-white transition-all shadow-xl active:scale-95">
                Bypass Biometrics (Preview Mode)
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 flex overflow-hidden selection:bg-[#ed8936]/30">
      <aside className="w-80 bg-black text-white flex flex-col border-r border-white/5 relative z-50">
        <div className="p-10">
          <div className="flex items-center gap-4 mb-16 group cursor-pointer" onClick={() => setViewMode('analyze')}>
            <div className="w-16 h-16 bg-[#1a365d] rounded-[2rem] flex items-center justify-center shadow-[0_0_30px_rgba(26,54,93,0.3)] border border-[#ed8936]/20 transition-all group-hover:scale-110 relative overflow-hidden">
               <i className="fas fa-radar text-2xl text-[#ed8936] relative z-10"></i>
            </div>
            <div>
              <span className="text-xl font-black tracking-tighter uppercase italic block leading-none">INTEL<span className="text-[#ed8936]">EXTRACT</span></span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Channel Changers</span>
            </div>
          </div>

          <nav className="space-y-4">
            {[
              { id: 'analyze', label: 'Ingestion Lab', icon: 'fa-microchip' },
              { id: 'pods', label: 'Knowledge Pods', icon: 'fa-cubes' },
              { id: 'chat', label: 'Agent Console', icon: 'fa-terminal' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setViewMode(item.id as ViewMode)}
                className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                  viewMode === item.id 
                    ? 'bg-[#ed8936] text-white shadow-2xl shadow-[#ed8936]/30 translate-x-1 ring-1 ring-white/10' 
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <i className={`fas ${item.icon} text-xl w-8 text-center`}></i>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-10 border-t border-white/5 space-y-6">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={signOut}>
             <img src={user.picture} className="w-12 h-12 rounded-2xl border border-white/10 group-hover:border-[#ed8936] transition-all shadow-lg" alt="P" />
             <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white truncate">{user.name}</p>
                <p className="text-[9px] text-[#ed8936] font-black uppercase tracking-widest">Sign Out</p>
             </div>
          </div>
          <div className="p-6 bg-slate-900/40 rounded-[2.5rem] border border-white/5">
             <div className="flex items-center gap-2 mb-3">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></span>
               <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">System Active</span>
             </div>
             <p className="text-sm font-black text-white truncate leading-none mb-1">{profile.name}</p>
             {profile.voiceProfile && <p className="text-[8px] font-black text-[#ed8936] uppercase">Voice Profile Synced</p>}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-28 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-12 sticky top-0 z-40">
           <div className="flex flex-col">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-2">Module Active</h2>
              <span className="text-3xl font-black text-white tracking-tighter uppercase italic">
                {viewMode === 'analyze' ? (isVoiceDnaMode ? 'Voice DNA Extraction' : isCompetitorMode ? 'Competitor Scouter' : 'Intel Ingestion Lab') : viewMode === 'pods' ? 'Knowledge Pods' : 'Agent Command'}
              </span>
           </div>
           
           <div className="flex items-center gap-8">
              {viewMode === 'analyze' && (
                <div className="flex bg-slate-900 p-2 rounded-2xl border border-white/5 shadow-inner">
                  <button onClick={() => { setIsCompetitorMode(false); setIsVoiceDnaMode(false); }} className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isCompetitorMode && !isVoiceDnaMode ? 'bg-[#1a365d] text-white shadow-lg border border-[#ed8936]/20' : 'text-slate-500 hover:text-slate-300'}`}>Standard</button>
                  <button onClick={() => { setIsCompetitorMode(true); setIsVoiceDnaMode(false); }} className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isCompetitorMode ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Competitor</button>
                  <button onClick={() => { setIsVoiceDnaMode(true); setIsCompetitorMode(false); }} className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isVoiceDnaMode ? 'bg-[#ed8936] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Voice DNA</button>
                </div>
              )}
              <div className="h-12 w-px bg-white/5"></div>
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/10 shadow-xl flex items-center justify-center text-[#ed8936]">
                <i className="fas fa-satellite-dish text-xl animate-pulse"></i>
              </div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[#020617] relative">
          <div className="max-w-7xl mx-auto h-full">
            {viewMode === 'analyze' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 h-full">
                <div className="lg:col-span-4 space-y-10 animate-in slide-in-from-left duration-700">
                  <CompanyProfileEditor profile={profile} setProfile={setProfile} />
                </div>
                
                <div className="lg:col-span-8">
                  {stage === AnalysisStage.IDLE || stage === AnalysisStage.ERROR ? (
                    <div className="bg-slate-900/30 p-12 rounded-[4rem] border border-white/5 animate-in fade-in zoom-in-95 duration-500 shadow-2xl relative">
                      <div className="mb-12 relative z-10">
                        <h1 className="text-7xl font-black text-white mb-6 tracking-tighter leading-none">
                          {isVoiceDnaMode ? 'Voice DNA Lab' : isCompetitorMode ? 'Scouting Lab' : 'Ingestion Lab'}
                        </h1>
                        <p className="text-slate-400 text-2xl font-medium max-w-xl leading-snug">
                          {isVoiceDnaMode ? 'Upload YOUR OWN content to extract style and voice patterns.' : isCompetitorMode ? 'Analyze rival positioning and pricing signals.' : 'Input raw content to generate Pod-structured intelligence.'}
                        </p>
                      </div>

                      <div className="relative mb-10 group z-10">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#1a365d] to-[#ed8936] rounded-[3rem] blur opacity-10 group-focus-within:opacity-25 transition-all"></div>
                        <textarea
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder={isVoiceDnaMode ? "Paste your own video URLs or writing samples..." : isCompetitorMode ? "Paste competitor video URLs or transcripts..." : "Paste YouTube URL or raw content transcript..."}
                          className="relative w-full h-[450px] px-12 py-12 bg-black/60 border border-white/10 rounded-[3rem] focus:ring-8 focus:ring-[#1a365d]/50 outline-none transition-all resize-none text-slate-200 font-medium text-2xl shadow-inner placeholder:text-slate-800"
                        />
                      </div>

                      <button onClick={handleProcess} disabled={!inputText.trim() || stage === AnalysisStage.EXTRACTING} 
                        className={`w-full py-10 text-white rounded-[3rem] font-black text-3xl transition-all shadow-2xl flex items-center justify-center gap-8 group active:scale-[0.98] relative z-10 ${
                          isVoiceDnaMode ? 'bg-[#ed8936] hover:bg-[#dd7926]' : isCompetitorMode ? 'bg-slate-800 hover:bg-black' : 'bg-[#1a365d] hover:bg-[#2a4a7d]'
                        }`}
                      >
                        {isVoiceDnaMode ? 'Extract My Voice DNA' : isCompetitorMode ? 'Analyze Competitive Signals' : 'Initialize Pod Ingestion'}
                        <i className={`fas ${isVoiceDnaMode ? 'fa-dna' : isCompetitorMode ? 'fa-user-ninja' : 'fa-radar'} group-hover:rotate-12 transition-transform`}></i>
                      </button>
                    </div>
                  ) : stage === AnalysisStage.COMPLETED && result ? (
                    <div className="space-y-12 animate-in fade-in duration-700">
                      <div className="flex justify-between items-center">
                         <button onClick={() => { setStage(AnalysisStage.IDLE); setInputText(''); }} className="px-8 py-4 bg-slate-900 text-[#ed8936] border border-[#ed8936]/20 rounded-2xl font-black text-lg flex items-center gap-4 hover:translate-x-[-4px] transition-all shadow-xl">
                           <i className="fas fa-arrow-left"></i> Analyze New Context
                         </button>
                         {syncStatus && (
                            <div className="px-8 py-4 bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 rounded-2xl font-black text-lg flex items-center gap-4 animate-in zoom-in-95">
                              <i className="fas fa-cloud-check"></i> Synced to Command Center
                            </div>
                         )}
                      </div>
                      <ResultDisplay result={result} profile={profile} onUpdate={handleUpdateResult} />
                    </div>
                  ) : (
                    <div className="bg-slate-900/20 p-40 rounded-[5rem] border border-white/5 flex flex-col items-center justify-center text-center shadow-2xl">
                      <div className="relative w-48 h-48 mb-16">
                        <div className="absolute inset-0 border-[14px] border-white/5 rounded-full"></div>
                        <div className="absolute inset-0 border-[14px] border-t-[#ed8936] rounded-full animate-spin shadow-[0_0_40px_rgba(237,137,54,0.3)]"></div>
                      </div>
                      <h3 className="text-5xl font-black text-white mb-8 tracking-tighter">Synthesizing Intelligence...</h3>
                      <p className="text-slate-500 max-w-lg text-2xl font-medium leading-relaxed">Processing multi-context grounding for Channel Changers.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {viewMode === 'pods' && (
              <div className="h-full">
                <WorkspaceDrive library={library} clients={profile.clientProfiles || []} onSelect={handleSelectFromLibrary} onDelete={handleDelete} />
              </div>
            )}

            {viewMode === 'chat' && (
              <div className="max-w-6xl mx-auto h-full flex flex-col">
                <Chatbot profile={profile} library={library} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
