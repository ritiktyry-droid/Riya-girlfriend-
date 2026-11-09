export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: string;
  modelUsed?: string;
  groundingChunks?: GroundingChunk[];
  audioBase64?: string;
  isTaskExecution?: boolean;
  taskDetails?: {
    action: string;
    target?: string;
    status: 'success' | 'executing' | 'failed';
  };
  synced?: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  type: 'app_launch' | 'search' | 'battery' | 'reminder' | 'file' | 'termux';
  description: string;
  command?: string;
  timestamp: string;
  completed: boolean;
}

export interface ReminderItem {
  id: string;
  title: string;
  time: string;
  completed: boolean;
}

export interface UserPreferences {
  userName: string;
  relationship: 'Friend' | 'Girlfriend' | 'Bestie' | 'Assistant';
  personality: 'Sweet & Caring' | 'Playful & Flirty' | 'Smart & Professional' | 'Cheerleader';
  voiceVoiceName: 'Kore' | 'Zephyr' | 'Aoede' | 'Fenrir' | 'Puck';
  autoVoiceReply: boolean;
  searchGrounding: boolean;
  activeModel: 'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.8-flash-thinking';
  soundEffects: boolean;
  hapticFeedback: boolean;
  themeColor: string;
}

export interface SyncState {
  isOnline: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncedAt: string | null;
  pendingChangesCount: number;
}

export type EmotionType =
  | 'Happy'
  | 'Romantic'
  | 'Excited'
  | 'Peaceful'
  | 'Tired'
  | 'Stressed'
  | 'Sad';

export interface MoodEntry {
  id: string;
  date: string; // e.g. "2026-11-08"
  dayLabel: string; // e.g. "Sun"
  emotion: EmotionType;
  emoji: string;
  score: number; // 1-10 scale for chart visualization
  note?: string;
  timestamp: string;
}

