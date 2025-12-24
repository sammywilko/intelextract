
export interface ClientProfile {
  name: string;
  industry: string;
}

export interface VoiceProfile {
  signaturePhrases: string[];
  sentenceStructures: string;
  hookStyles: string[];
  vocabulary: string[];
  antiPatterns: string[];
  lastUpdated: string;
}

export interface CompanyProfile {
  name: string;
  industry: string;
  focus: string;
  goals: string;
  clientProfiles?: ClientProfile[];
  voiceProfile?: VoiceProfile;
}

export interface VisualMarker {
  timestamp?: string;
  description: string;
  significance: string;
}

export interface StrategicAlignment {
  score: number; // 0-100
  accelerationPath: string;
  threatAssessment: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface GlossaryEntry {
  term: string;
  definition: string;
}

export interface SpeakerTurn {
  speaker: string;
  text: string;
  timestamp?: string;
}

export interface BoardAdvisor {
  persona: string;
  critique: string;
  priority: 'low' | 'medium' | 'high';
}

export interface TacticalCritique {
  blindSpots: string[];
  hiddenRisks: string[];
  growthLevers: string[];
  advisors: BoardAdvisor[];
}

export interface AutomationTask {
  id: string;
  type: 'docs' | 'sheets' | 'slides' | 'calendar' | 'gmail';
  status: 'pending' | 'completed' | 'error';
  label: string;
}

export interface AnalysisResult {
  id: string;
  title: string;
  category: string;
  summary: string;
  keyInsights: string[];
  actionItems: string[];
  glossary: GlossaryEntry[];
  speakers: SpeakerTurn[];
  luckySuggestion?: {
    appIdea: string;
    marketPotential: string;
  };
  studySuggestions: {
    topic: string;
    description: string;
  }[];
  officialDocs?: GroundingSource[];
  transcript: string;
  timestamp: string;
  rating?: number; // 1-5
  feedbackNote?: string;
  isHighRelevance?: boolean;
  clientRelevanceScores?: ClientRelevanceScore[];
  deepResearchMarkdown?: string;
  automationHistory?: AutomationTask[];
  hookBank?: string[];
  quotableMoments?: string[];
  tacticalCritique?: TacticalCritique;
  visualIntel?: VisualMarker[];
  strategicAlignment?: StrategicAlignment;
  voiceDna?: VoiceProfile;
  sourceUrl?: string;
}

export interface ClientRelevanceScore {
  clientName: string;
  score: number;
  reasoning: string;
}

export enum AnalysisStage {
  IDLE = 'IDLE',
  EXTRACTING = 'EXTRACTING',
  SEARCHING = 'SEARCHING',
  DEEP_RESEARCH = 'DEEP_RESEARCH',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
