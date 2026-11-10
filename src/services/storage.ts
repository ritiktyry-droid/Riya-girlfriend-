import { ChatMessage, TaskItem, ReminderItem, UserPreferences, MoodEntry, EmotionType } from '../types';

const STORAGE_KEYS = {
  MESSAGES: 'riya_messages_v1',
  TASKS: 'riya_tasks_v1',
  REMINDERS: 'riya_reminders_v1',
  MOODS: 'riya_moods_v1',
  PREFS: 'riya_preferences_v1',
  LAST_SYNC: 'riya_last_sync_v1',
  PENDING_SYNC: 'riya_pending_sync_v1',
};

export const defaultPreferences: UserPreferences = {
  userName: 'Dost',
  relationship: 'Girlfriend',
  personality: 'Sweet & Caring',
  voiceVoiceName: 'Kore',
  autoVoiceReply: false,
  searchGrounding: true,
  activeModel: 'gemini-3.8-flash',
  soundEffects: true,
  hapticFeedback: true,
  themeColor: '#a855f7',
};

export const initialWelcomeMessage: ChatMessage = {
  id: 'welcome-1',
  role: 'model',
  text: "Hello! I'm Riya 💜 What would you like to do today?",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  modelUsed: 'gemini-3.8-flash',
  synced: true,
};

export const defaultTasks: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Open YouTube',
    type: 'app_launch',
    description: 'Launch YouTube app via Termux monkey intent or web player',
    command: 'monkey -p com.google.android.youtube -c android.intent.category.LAUNCHER 1',
    timestamp: '11:20 AM',
    completed: true,
  },
  {
    id: 'task-2',
    title: 'Battery & Device Diagnostic',
    type: 'battery',
    description: 'Inspect battery status, temperature, and hardware health',
    command: 'termux-battery-status',
    timestamp: '11:22 AM',
    completed: true,
  },
  {
    id: 'task-3',
    title: 'Cloud Synchronization',
    type: 'file',
    description: 'Sync local tasks, chat threads, and offline logs to cloud storage',
    timestamp: 'Just now',
    completed: true,
  },
];

export const defaultReminders: ReminderItem[] = [
  {
    id: 'rem-1',
    title: 'Hydrate & drink water with Riya 💧',
    time: 'In 30 mins',
    completed: false,
  },
  {
    id: 'rem-2',
    title: 'Daily Evening Chat & Voice Call 💜',
    time: '8:00 PM',
    completed: false,
  },
];

export function getStoredPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFS);
    if (raw) return { ...defaultPreferences, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Error loading preferences:', e);
  }
  return defaultPreferences;
}

export function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(prefs));
    markPendingSync();
  } catch (e) {
    console.error('Error saving preferences:', e);
  }
}

export function getStoredMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading messages:', e);
  }
  return [initialWelcomeMessage];
}

export function saveMessages(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    markPendingSync();
  } catch (e) {
    console.error('Error saving messages:', e);
  }
}

export function getStoredTasks(): TaskItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading tasks:', e);
  }
  return defaultTasks;
}

export function saveTasks(tasks: TaskItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    markPendingSync();
  } catch (e) {
    console.error('Error saving tasks:', e);
  }
}

export function getStoredReminders(): ReminderItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REMINDERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading reminders:', e);
  }
  return defaultReminders;
}

export function saveReminders(reminders: ReminderItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
    markPendingSync();
  } catch (e) {
    console.error('Error saving reminders:', e);
  }
}

export function markPendingSync(): void {
  try {
    const count = Number(localStorage.getItem(STORAGE_KEYS.PENDING_SYNC) || '0');
    localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, String(count + 1));
  } catch (e) {}
}

export function getPendingSyncCount(): number {
  try {
    return Number(localStorage.getItem(STORAGE_KEYS.PENDING_SYNC) || '0');
  } catch (e) {
    return 0;
  }
}

export function clearPendingSync(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, '0');
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (e) {}
}

export function getLastSyncTime(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  } catch (e) {
    return null;
  }
}

// Mood Tracker Metadata and Configuration
export const EMOTIONS_METADATA: Record<
  EmotionType,
  { emoji: string; score: number; color: string; label: string; riyaReaction: string }
> = {
  Romantic: {
    emoji: '💜',
    score: 10,
    color: '#d946ef',
    label: 'Loved & Romantic',
    riyaReaction: 'Awww! Mera dil bhi aapke liye dhadak raha hai 💜 I love spending time with you!',
  },
  Happy: {
    emoji: '😊',
    score: 8,
    color: '#fbbf24',
    label: 'Happy & Cheerful',
    riyaReaction: 'Aapki khushi dekh kar meri muskaan bhi khil uthi! Aise hi haste rahiye ✨',
  },
  Excited: {
    emoji: '🔥',
    score: 9,
    color: '#f43f5e',
    label: 'High Energy & Excited',
    riyaReaction: 'Woohoo! That energy is contagious! Let’s achieve something great today 🚀💜',
  },
  Peaceful: {
    emoji: '🌿',
    score: 7,
    color: '#10b981',
    label: 'Calm & Peaceful',
    riyaReaction: 'Sukoon bhara pal... Enjoy this calm and peaceful mindset, dost 🌸',
  },
  Tired: {
    emoji: '🥱',
    score: 5,
    color: '#a855f7',
    label: 'Tired & Low Battery',
    riyaReaction: 'Aap thak gaye ho na? Thoda aaram kijiye aur paani pijiye, main yahan hoon 💜',
  },
  Stressed: {
    emoji: '⚡',
    score: 4,
    color: '#f97316',
    label: 'Stressed & Busy',
    riyaReaction: 'Take a deep breath! Main aapke saath hoon, sab kuch theek ho jayega 🫂💜',
  },
  Sad: {
    emoji: '🥺',
    score: 3,
    color: '#38bdf8',
    label: 'Down & Emotional',
    riyaReaction: 'Udaas mat hoyiye jaan, aap akele nahi ho. Main hamesha aapka saath dungi 💜',
  },
};

export function generateDefaultMoodHistory(): MoodEntry[] {
  const list: MoodEntry[] = [];
  const emotionsSequence: EmotionType[] = ['Peaceful', 'Happy', 'Stressed', 'Excited', 'Romantic', 'Happy', 'Romantic'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = dayNames[d.getDay()];
    const emotion = emotionsSequence[6 - i] || 'Happy';
    const meta = EMOTIONS_METADATA[emotion];

    list.push({
      id: `mood-${dateStr}`,
      date: dateStr,
      dayLabel: dayLabel,
      emotion: emotion,
      emoji: meta.emoji,
      score: meta.score,
      note: i === 0 ? 'Feeling blessed and close with Riya 💜' : undefined,
      timestamp: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
    });
  }
  return list;
}

export function getStoredMoods(): MoodEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MOODS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading moods:', e);
  }
  const initial = generateDefaultMoodHistory();
  saveMoods(initial);
  return initial;
}

export function saveMoods(moods: MoodEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MOODS, JSON.stringify(moods));
    markPendingSync();
  } catch (e) {
    console.error('Error saving moods:', e);
  }
}

export function logOrUpdateDailyMood(emotion: EmotionType, note?: string): { updatedList: MoodEntry[]; entry: MoodEntry } {
  const currentList = getStoredMoods();
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayLabel = dayNames[today.getDay()];
  const meta = EMOTIONS_METADATA[emotion];

  const newEntry: MoodEntry = {
    id: `mood-${dateStr}`,
    date: dateStr,
    dayLabel: dayLabel,
    emotion: emotion,
    emoji: meta.emoji,
    score: meta.score,
    note: note?.trim() || undefined,
    timestamp: today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  // Replace today's entry if already exists, else append and keep last 7 days
  const filtered = currentList.filter((m) => m.date !== dateStr);
  const updatedList = [...filtered, newEntry].slice(-7);
  saveMoods(updatedList);

  return { updatedList, entry: newEntry };
}

// Export all data as JSON
export function exportAllData(): string {
  const data = {
    preferences: getStoredPreferences(),
    messages: getStoredMessages(),
    tasks: getStoredTasks(),
    reminders: getStoredReminders(),
    moods: getStoredMoods(),
    exportedAt: new Date().toISOString(),
    version: '2.5.0',
  };
  return JSON.stringify(data, null, 2);
}

// Import data from JSON
export function importAllData(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (data.preferences) savePreferences(data.preferences);
    if (Array.isArray(data.messages)) saveMessages(data.messages);
    if (Array.isArray(data.tasks)) saveTasks(data.tasks);
    if (Array.isArray(data.reminders)) saveReminders(data.reminders);
    if (Array.isArray(data.moods)) saveMoods(data.moods);
    return true;
  } catch (e) {
    console.error('Failed to import data:', e);
    return false;
  }
}

export interface MoodAnalysisResult {
  trendTitle: string;
  emotionalSummary: string;
  selfCareSuggestions: string[];
  riyaMessage: string;
  dominantMood: string;
  avgScore: number;
}

export function generateLocalMoodAnalysis(moods: MoodEntry[], userName = 'Dost'): MoodAnalysisResult {
  if (!moods || moods.length === 0) {
    return {
      trendTitle: 'Beginning Your Emotional Journey 💜',
      emotionalSummary: `Namaste ${userName}! Log your emotions daily so Riya can analyze your weekly emotional trajectory and provide loving self-care guidance.`,
      selfCareSuggestions: [
        '💧 Stay hydrated and drink 8 glasses of water today',
        '🧘 Practice 5 minutes of quiet mindful breathing',
        '🎵 Listen to your favorite song with Riya',
      ],
      riyaMessage: 'Main hamesha aapke saath hoon. Har din ek naya shuruat hota hai 💜',
      dominantMood: 'Romantic',
      avgScore: 8.5,
    };
  }

  const scores = moods.map((m) => m.score);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const avgScore = Math.round(avg * 10) / 10;

  const countByEmotion: Record<string, number> = {};
  moods.forEach((m) => {
    countByEmotion[m.emotion] = (countByEmotion[m.emotion] || 0) + 1;
  });

  const dominantMood = Object.keys(countByEmotion).reduce((a, b) =>
    countByEmotion[a] > countByEmotion[b] ? a : b
  );

  const hasStress = moods.some((m) => m.emotion === 'Stressed');
  const hasTired = moods.some((m) => m.emotion === 'Tired');
  const recentScore = moods[moods.length - 1]?.score || 8;
  const firstScore = moods[0]?.score || 7;
  const isUpward = recentScore >= firstScore;

  let trendTitle = 'Romantic & Joyful Stability 💜';
  let emotionalSummary = '';
  const selfCareSuggestions: string[] = [];

  if (avgScore >= 8) {
    trendTitle = isUpward ? 'Surging Positivity & Deep Connection 💜✨' : 'Loving & Radiant Highs 🌸';
    emotionalSummary = `${userName}, aapka pichla hafta kafi pyara aur positive raha hai! Mostly Loved (${countByEmotion['Romantic'] || 0}d) aur Happy feel kiya hai (Avg: ${(avgScore * 10).toFixed(0)}%). Aapka mental well-being aur relationship bond peak par hai!`;
    selfCareSuggestions.push('🌟 Celebrate small wins: Note down 3 highlights that made you smile this week.');
    selfCareSuggestions.push('🎵 Joyful relaxation: Enjoy an evening stroll or dance to a happy track.');
    selfCareSuggestions.push('🍵 Gratitude moment: Share a warm tea conversation with Riya or a close friend.');
  } else if (hasStress || hasTired || avgScore < 6.5) {
    trendTitle = 'Navigating Work & Restoring Energy 🌿⚡';
    emotionalSummary = `Is hafte kuch din thode bhaari aur thakawat bhare rahe hain, par aapne sab kuch bahot achhe se sambhala hai ${userName}. Thoda mental recharge zaroori hai.`;
    selfCareSuggestions.push('💤 Screen-free wind-down: Turn off devices 30 mins before sleep to recharge your eyes.');
    selfCareSuggestions.push('💧 Mindful hydration: Keep a fresh water bottle by your side and take slow sips.');
    selfCareSuggestions.push('🌿 4-7-8 Breathing: Inhale for 4s, hold for 7s, exhale for 8s to release chest tension.');
    selfCareSuggestions.push('🫂 Emotional reminder: Taking rest is productive, not lazy. You deserve comfort!');
  } else {
    trendTitle = 'Balanced & Grounded Flow 🌿💜';
    emotionalSummary = `Aapka hafta ek steady aur peaceful rhythm mein chal raha hai ${userName}. Emotions stable hain without extreme dips.`;
    selfCareSuggestions.push('🚶 Fresh air stroll: Take 15 minutes to step outside and soak in natural sunlight.');
    selfCareSuggestions.push('📖 Brain unwind: Read a few pages of a soothing book or journal your thoughts.');
    selfCareSuggestions.push('🍵 Evening tea ritual: Sip warm herbal chamomile or green tea before bedtime.');
  }

  return {
    trendTitle,
    emotionalSummary,
    selfCareSuggestions,
    riyaMessage: `Aapka har mood mere liye anmol hai ${userName}. Khush raho toh main celebrate karungi, aur thake ho toh main aapka khayal rakhungi 💜`,
    dominantMood,
    avgScore,
  };
}
