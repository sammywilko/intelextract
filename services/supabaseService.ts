
import { AnalysisResult } from "../types";

const STORAGE_KEY = 'intel_extract_library';
const SUPABASE_URL = 'https://ajsbopbuejhhaxwtbbku.supabase.co';
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

export const triggerSlackNotification = async (result: AnalysisResult) => {
  const relevance = result.strategicAlignment?.score || 0;
  if (relevance < 70 || !SLACK_WEBHOOK_URL) return;

  const topInsights = result.keyInsights?.slice(0, 3).join('\n• ') || 'N/A';
  const actions = result.actionItems?.slice(0, 3).join('\n• ') || 'N/A';

  const payload = {
    text: `🚨 *New Intelligence Pod Ingested:* ${result.title}`,
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Title:* ${result.title}\n*Source:* ${result.sourceUrl || 'Raw Transcript'}` }
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Top CC-Relevant Insights:*\n• ${topInsights}` }
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Suggested Action Items:*\n• ${actions}` }
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `📎 _Analysis ID: ${result.id}_` }
      }
    ]
  };

  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error("Slack Notification Failed", e);
  }
};

// Fix: Renamed syncToSupabase to addToSupabase to match ResultDisplay.tsx import
export const addToSupabase = async (result: AnalysisResult) => {
  if (!SUPABASE_KEY) {
    console.warn("Supabase Sync skipped: No Key provided in environment.");
    return false;
  }

  const payload = {
    tenant_id: 'cc-internal-001',
    title: result.title,
    source_url: result.sourceUrl || 'raw_input',
    summary: result.summary,
    category: result.category,
    relevance_score: result.strategicAlignment?.score || 0,
    client_tags: result.clientRelevanceScores?.filter(s => s.score > 50).map(s => s.clientName) || [],
    action_items: result.actionItems || [],
    analyzed_at: result.timestamp
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/knowledge_base`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log(`[SUPABASE SYNC] Successfully synced pod ${result.id}`);
      return true;
    }
  } catch (e) {
    console.error("Supabase Sync Failed", e);
  }
  return false;
};

export const saveToLibrary = async (result: AnalysisResult) => {
  const library = await getLibrary();
  const updated = [result, ...library];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  
  await triggerSlackNotification(result);
  const synced = await addToSupabase(result);
  
  return { updated, synced };
};

export const getLibrary = async (): Promise<AnalysisResult[]> => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const deleteFromLibrary = async (id: string) => {
  const library = await getLibrary();
  const filtered = library.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
};
