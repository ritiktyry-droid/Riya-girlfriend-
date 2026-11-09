import { ChatMessage, TaskItem, ReminderItem, UserPreferences } from '../types';

const STORAGE_KEYS = {
  MESSAGES: 'riya_messages_v1',
  TASKS: 'riya_tasks_v1',
  REMINDERS: 'riya_reminders_v1',
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

// Export all data as JSON
export function exportAllData(): string {
  const data = {
    preferences: getStoredPreferences(),
    messages: getStoredMessages(),
    tasks: getStoredTasks(),
    reminders: getStoredReminders(),
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
    return true;
  } catch (e) {
    console.error('Failed to import data:', e);
    return false;
  }
}
