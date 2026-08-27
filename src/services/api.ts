import { ChatMessage, JournalSummary } from '../types';

export interface ChatResponse {
  reply: string;
  modelUsed: string;
}

export interface SummaryResponse {
  data: JournalSummary;
  modelUsed: string;
}

export interface AggregateInsightsResponse {
  weeklyTheme: string;
  coachingTip: string;
  encouragement: string;
}

export const geminiApi = {
  /**
   * Send messages to multi-turn conversational journal assistant
   */
  async sendMessage(messages: ChatMessage[], journalContext?: string): Promise<ChatResponse> {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, journalContext }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${res.status}`);
    }

    return res.json();
  },

  /**
   * Generate automatic title, summary, key takeaways, and mood insight
   */
  async generateSummary(messages: ChatMessage[]): Promise<SummaryResponse> {
    const res = await fetch('/api/gemini/summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${res.status}`);
    }

    return res.json();
  },

  /**
   * Aggregate insights from multiple saved journal entries
   */
  async getAggregateInsights(entries: any[]): Promise<AggregateInsightsResponse> {
    const res = await fetch('/api/gemini/insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entries }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${res.status}`);
    }

    return res.json();
  },
};
