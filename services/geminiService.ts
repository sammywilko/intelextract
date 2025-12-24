
import { GoogleGenAI, Type } from "@google/genai";
import { CompanyProfile, AnalysisResult, GroundingSource, TacticalCritique, VoiceProfile } from "../types";

const PRIMARY_MODEL = 'gemini-3-flash-preview';
const RESEARCH_MODEL = 'gemini-3-pro-preview';

export const analyzeTranscript = async (
  input: string, 
  profile: CompanyProfile,
  isCompetitorMode: boolean = false,
  isVoiceDnaMode: boolean = false
): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const isYoutube = input.includes('youtube.com/') || input.includes('youtu.be/') || input.startsWith('http');

  let groundedContext = input;
  let groundingMetadata: any = null;

  if (isYoutube) {
    const searchResponse = await ai.models.generateContent({
      model: RESEARCH_MODEL,
      contents: `Find the transcript, detailed summary, and key metadata for this video/link: ${input}. Provide as much factual detail as possible so I can analyze it for business intelligence.`,
      config: { 
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });
    
    groundedContext = `Original Link: ${input}\n\nVerified Content Details from Google Search:\n${searchResponse.text}`;
    groundingMetadata = searchResponse.candidates?.[0]?.groundingMetadata;
  }

  const basePrompt = `Analyze this content for Channel Changers INTELEXTRACT Command Center. 
  Apply Brand Context Filter for "${profile.name}". Goal Context: "${profile.goals}".`;

  const standardExtractionPrompt = `
    ${basePrompt}
    INTELEXTRACT BRAND FILTERS:
    1. Apply to premium AI video production.
    2. Relevance for B2B enterprise clients.
    3. Workflows CC can automate.
    
    TASKS:
    1. Title, Summary, Category.
    2. 5 Strategic Insights.
    3. Alignment Score (0-100).
    4. Study Suggestions, Hook Bank, Glossary, Client Relevance.
  `;

  const voiceDnaPrompt = `
    ${basePrompt}
    SPECIAL MODE: VOICE DNA EXTRACTION
    Analyze the provided text to extract the unique content creation patterns of the speaker.
    
    EXTRACT:
    - Signature phrases used repeatedly.
    - Sentence structure patterns (long vs short, active vs passive, technical vs simple).
    - Opening hook styles.
    - Vocabulary preferences (unique words or tone).
    - Anti-patterns to avoid (things the speaker explicitly avoids or bad habits detected).
    
    Produce a JSON object matching the VoiceProfile schema.
  `;

  const properties: any = isVoiceDnaMode ? {
    title: { type: Type.STRING },
    category: { type: Type.STRING },
    summary: { type: Type.STRING },
    voiceDna: {
      type: Type.OBJECT,
      properties: {
        signaturePhrases: { type: Type.ARRAY, items: { type: Type.STRING } },
        sentenceStructures: { type: Type.STRING },
        hookStyles: { type: Type.ARRAY, items: { type: Type.STRING } },
        vocabulary: { type: Type.ARRAY, items: { type: Type.STRING } },
        antiPatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['signaturePhrases', 'sentenceStructures', 'hookStyles', 'vocabulary', 'antiPatterns']
    }
  } : {
    title: { type: Type.STRING },
    category: { type: Type.STRING },
    summary: { type: Type.STRING },
    keyInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
    actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
    hookBank: { type: Type.ARRAY, items: { type: Type.STRING } },
    strategicAlignment: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        accelerationPath: { type: Type.STRING },
        threatAssessment: { type: Type.STRING }
      },
      required: ['score', 'accelerationPath', 'threatAssessment']
    },
    studySuggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { topic: { type: Type.STRING }, description: { type: Type.STRING } },
        required: ['topic', 'description']
      }
    },
    visualIntel: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { timestamp: { type: Type.STRING }, description: { type: Type.STRING }, significance: { type: Type.STRING } },
        required: ['description', 'significance']
      }
    },
    glossary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { term: { type: Type.STRING }, definition: { type: Type.STRING } },
        required: ['term', 'definition']
      }
    },
    clientRelevanceScores: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { clientName: { type: Type.STRING }, score: { type: Type.NUMBER }, reasoning: { type: Type.STRING } },
        required: ['clientName', 'score', 'reasoning']
      }
    },
    luckySuggestion: {
      type: Type.OBJECT,
      properties: { appIdea: { type: Type.STRING }, marketPotential: { type: Type.STRING } },
      required: ['appIdea', 'marketPotential']
    }
  };

  const finalPrompt = isVoiceDnaMode ? voiceDnaPrompt : standardExtractionPrompt;

  const response = await ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: [{ parts: [{ text: finalPrompt }, { text: groundedContext }] }],
    config: {
      responseMimeType: 'application/json',
      responseSchema: { 
        type: Type.OBJECT, 
        properties, 
        required: isVoiceDnaMode ? ['title', 'summary', 'voiceDna'] : ['title', 'summary', 'keyInsights', 'strategicAlignment', 'visualIntel', 'clientRelevanceScores', 'luckySuggestion', 'studySuggestions'] 
      }
    }
  });

  const parsed = JSON.parse(response.text || '{}');
  const officialDocs: GroundingSource[] = [];

  if (!isVoiceDnaMode) {
    const searchDocs = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: `Official technical whitepapers, documentation, and authority sources for: "${parsed.title}" in the context of ${profile.industry}`,
      config: { tools: [{ googleSearch: {} }] }
    });

    const groundingChunks = searchDocs.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    groundingChunks.filter((chunk: any) => chunk.web).forEach((chunk: any) => {
      officialDocs.push({ title: chunk.web.title, uri: chunk.web.uri });
    });
  }

  return {
    id: crypto.randomUUID(),
    ...parsed,
    officialDocs,
    category: parsed.category || (isVoiceDnaMode ? 'Voice DNA' : isCompetitorMode ? 'Market Research' : 'Strategy'),
    speakers: [],
    transcript: isYoutube ? groundedContext : input,
    sourceUrl: isYoutube ? input : undefined,
    timestamp: new Date().toISOString(),
    isHighRelevance: (parsed.strategicAlignment?.score || 0) > 70
  };
};

// Fix: Implemented missing executeDeepResearch function
/**
 * Conducts deep research on a given topic using Google Search grounding.
 */
export const executeDeepResearch = async (
  query: string,
  profile: CompanyProfile
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: RESEARCH_MODEL,
    contents: `Conduct deep research for ${profile.name} (Industry: ${profile.industry}) on: ${query}. Use Google Search. Format as detailed Markdown.`,
    config: {
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 4000 }
    }
  });
  return response.text || "No research findings available.";
};

// Fix: Implemented missing executeTacticalCritique function
/**
 * Performs a tactical critique of the intelligence result from multiple persona perspectives.
 */
export const executeTacticalCritique = async (
  result: AnalysisResult,
  profile: CompanyProfile
): Promise<TacticalCritique> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Critique this analysis for ${profile.name} (${profile.industry}). Identify blind spots, risks, and growth levers.
  
  Context: ${JSON.stringify({ title: result.title, summary: result.summary, insights: result.keyInsights })}
  `;

  const response = await ai.models.generateContent({
    model: RESEARCH_MODEL,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          blindSpots: { type: Type.ARRAY, items: { type: Type.STRING } },
          hiddenRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
          growthLevers: { type: Type.ARRAY, items: { type: Type.STRING } },
          advisors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                persona: { type: Type.STRING },
                critique: { type: Type.STRING },
                priority: { type: Type.STRING }
              },
              required: ['persona', 'critique', 'priority']
            }
          }
        },
        required: ['blindSpots', 'hiddenRisks', 'growthLevers', 'advisors']
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const createWorkspaceChat = (profile: CompanyProfile) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const voiceContext = profile.voiceProfile 
    ? `CHANNEL CHANGERS VOICE PROFILE:
       Phrases: ${profile.voiceProfile.signaturePhrases.join(', ')}
       Structure: ${profile.voiceProfile.sentenceStructures}
       Hooks: ${profile.voiceProfile.hookStyles.join(', ')}
       Vocabulary: ${profile.voiceProfile.vocabulary.join(', ')}
       Anti-patterns: ${profile.voiceProfile.antiPatterns.join(', ')}` 
    : "No Voice Profile configured yet.";

  return ai.chats.create({
    model: PRIMARY_MODEL,
    config: {
      systemInstruction: `You are the INTELEXTRACT Command Console AI for Channel Changers. 
      You assist in navigating Knowledge Pods. Use available notebook context to provide strategic advice.
      STRICT VOICE GUIDELINE: ${voiceContext}
      Maintain the voice profile in all responses.`
    }
  });
};
