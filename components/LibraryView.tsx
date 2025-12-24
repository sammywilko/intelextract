
import React from 'react';
import { AnalysisResult } from '../types';

interface Props {
  items: AnalysisResult[];
  onSelect: (item: AnalysisResult) => void;
  onDelete: (id: string) => void;
}

const LibraryView: React.FC<Props> = ({ items, onSelect, onDelete }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
        <i className="fas fa-folder-open text-5xl mb-4"></i>
        <p className="text-lg">Your library is empty. Start by analyzing a transcript!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
      {items.map((item) => (
        <div key={item.id} className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider">
              {item.category}
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
              className="text-slate-300 hover:text-red-500 transition-colors"
            >
              <i className="fas fa-trash-alt"></i>
            </button>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 cursor-pointer" onClick={() => onSelect(item)}>
            {item.title}
          </h3>
          <p className="text-slate-500 text-sm line-clamp-2 mb-4">
            {item.summary}
          </p>
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>{new Date(item.timestamp).toLocaleDateString()}</span>
            <span className="flex items-center gap-1">
              <i className="fas fa-file-alt"></i>
              {item.transcript.length} chars
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LibraryView;
