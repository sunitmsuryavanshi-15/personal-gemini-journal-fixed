export type MoodType = 
  | 'Grateful'
  | 'Optimistic'
  | 'Reflective'
  | 'Calm'
  | 'Energetic'
  | 'Thoughtful'
  | 'Determined'
  | 'Peaceful'
  | 'Challenged'
  | 'Curious';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface JournalInsight {
  mood: MoodType;
  moodConfidence: number; // 0 - 100
  sentimentScore: number; // -1.0 to 1.0
  positiveInsight: string;
  keyThemes: string[];
  suggestedAction?: string;
  energyLevel?: 'Low' | 'Moderate' | 'High';
}

export interface JournalSummary {
  title: string;
  summary: string;
  keyHighlights: string[];
  actionItems: string[];
  moodInsight: JournalInsight;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  summary: string;
  messages: ChatMessage[];
  keyHighlights: string[];
  actionItems: string[];
  mood: MoodType;
  moodConfidence: number;
  sentimentScore: number;
  positiveInsight: string;
  keyThemes: string[];
  suggestedAction?: string;
  createdAt: string; // ISO string
  updatedAt: string;
}

export interface ActiveConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUpdated: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}
