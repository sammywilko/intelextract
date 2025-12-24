
import React, { useState } from 'react';
import { CompanyProfile, ClientProfile } from '../types';

interface Props {
  profile: CompanyProfile;
  setProfile: (p: CompanyProfile) => void;
}

const CompanyProfileEditor: React.FC<Props> = ({ profile, setProfile }) => {
  const [newClientName, setNewClientName] = useState('');
  const [newClientIndustry, setNewClientIndustry] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const addClient = () => {
    if (!newClientName || !newClientIndustry) return;
    const clientProfiles = [...(profile.clientProfiles || []), { name: newClientName, industry: newClientIndustry }];
    setProfile({ ...profile, clientProfiles });
    setNewClientName('');
    setNewClientIndustry('');
  };

  const removeClient = (name: string) => {
    const clientProfiles = profile.clientProfiles?.filter(c => c.name !== name) || [];
    setProfile({ ...profile, clientProfiles });
  };

  return (
    <div className="bg-slate-900/60 p-10 rounded-[3rem] shadow-2xl border border-white/10 animate-in slide-in-from-left duration-500 backdrop-blur-xl">
      <h2 className="text-2xl font-black mb-10 flex items-center gap-4 text-white uppercase italic">
        <i className="fas fa-radar text-[#ed8936]"></i>
        Context Engine
      </h2>
      
      <div className="space-y-8">
        <div>
          <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-3">Organization</label>
          <input name="name" value={profile.name} onChange={handleChange} className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-2xl focus:ring-4 focus:ring-[#ed8936]/50 outline-none transition-all font-bold text-slate-100 placeholder:text-slate-800" />
        </div>
        
        <div>
          <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-3">North Star Goals</label>
          <textarea name="goals" value={profile.goals} onChange={handleChange} rows={6} className="w-full px-6 py-4 bg-black/40 border border-white/5 rounded-2xl focus:ring-4 focus:ring-[#ed8936]/50 outline-none resize-none transition-all text-sm font-medium text-slate-400 leading-relaxed placeholder:text-slate-800" />
        </div>

        {profile.voiceProfile && (
          <div className="p-6 bg-indigo-950/20 border border-indigo-500/20 rounded-[2rem] space-y-4">
             <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Voice DNA Profile</span>
                <i className="fas fa-fingerprint text-indigo-500"></i>
             </div>
             <p className="text-[11px] text-slate-400 leading-relaxed italic">
               "{profile.voiceProfile.sentenceStructures.slice(0, 100)}..."
             </p>
             <div className="flex flex-wrap gap-2">
                {profile.voiceProfile.signaturePhrases.slice(0, 3).map(p => (
                   <span key={p} className="px-2 py-1 bg-indigo-500/10 text-indigo-300 text-[8px] font-bold rounded uppercase">{p}</span>
                ))}
             </div>
          </div>
        )}

        <div className="pt-8 border-t border-white/5">
          <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-6 flex justify-between items-center">
            Active Intelligence Pods
            <span className="text-[#ed8936] font-mono">[{profile.clientProfiles?.length || 0}]</span>
          </label>
          
          <div className="space-y-3 mb-8 max-h-56 overflow-y-auto custom-scrollbar pr-3">
            {profile.clientProfiles?.map(client => (
              <div key={client.name} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl text-[11px] font-bold text-slate-300 border border-white/5 group animate-in slide-in-from-right duration-300">
                <span className="flex flex-col">
                  {client.name}
                  <span className="text-[9px] font-black text-[#ed8936] uppercase tracking-tighter mt-0.5">{client.industry}</span>
                </span>
                <button onClick={() => removeClient(client.name)} className="text-slate-700 hover:text-red-500 transition-colors">
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-3 bg-black/20 p-6 rounded-[2.5rem] border border-white/5 shadow-inner">
            <input value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Pod Label (e.g. Botivo)" className="w-full px-5 py-3 text-xs bg-black/60 border border-white/5 rounded-xl outline-none focus:ring-2 focus:ring-[#ed8936] transition-all font-bold text-white placeholder:text-slate-800" />
            <input value={newClientIndustry} onChange={e => setNewClientIndustry(e.target.value)} placeholder="Industry (e.g. BEVERAGES)" className="w-full px-5 py-3 text-xs bg-black/60 border border-white/5 rounded-xl outline-none focus:ring-2 focus:ring-[#ed8936] transition-all font-bold text-white placeholder:text-slate-800" />
            <button onClick={addClient} className="w-full mt-4 py-4 bg-[#1a365d] hover:bg-[#2a4a7d] text-white border border-[#ed8936]/30 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95">
              Inject New Lens
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfileEditor;
