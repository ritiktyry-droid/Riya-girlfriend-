import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { HomeTab } from './components/HomeTab';
import { ChatTab } from './components/ChatTab';
import { VoiceTab } from './components/VoiceTab';
import { TasksTab } from './components/TasksTab';
import { ProfileTab } from './components/ProfileTab';
import {
  ChatMessage,
  TaskItem,
  ReminderItem,
  UserPreferences,
  SyncState,
} from './types';
import {
  getStoredMessages,
  saveMessages,
  getStoredTasks,
  saveTasks,
  getStoredReminders,
  saveReminders,
  getStoredPreferences,
  savePreferences,
  getStoredMoods,
  getLastSyncTime,
  getPendingSyncCount,
  clearPendingSync,
} from './services/storage';
import { sendChatMessage, speakText, getRealBatteryInfo, pushSync } from './services/api';
import { parseAndExecuteCommand } from './services/commandRunner';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [messages, setMessages] = useState<ChatMessage[]>(() => getStoredMessages());
  const [tasks, setTasks] = useState<TaskItem[]>(() => getStoredTasks());
  const [reminders, setReminders] = useState<ReminderItem[]>(() => getStoredReminders());
  const [preferences, setPreferences] = useState<UserPreferences>(() => getStoredPreferences());
  const [isLoading, setIsLoading] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(100);

  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    syncStatus: 'synced',
    lastSyncedAt: getLastSyncTime(),
    pendingChangesCount: getPendingSyncCount(),
  });

  // Battery monitoring
  useEffect(() => {
    getRealBatteryInfo().then((info) => {
      if (info) setBatteryLevel(info.level);
    });
  }, []);

  // Online / Offline synchronization listeners
  useEffect(() => {
    const handleOnline = () => {
      setSyncState((prev) => ({ ...prev, isOnline: true }));
      triggerCloudSync();
    };

    const handleOffline = () => {
      setSyncState((prev) => ({ ...prev, isOnline: false, syncStatus: 'offline' }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [messages, tasks, reminders, preferences]);

  // Cloud sync trigger
  const triggerCloudSync = useCallback(async () => {
    if (!navigator.onLine) {
      setSyncState((prev) => ({ ...prev, syncStatus: 'offline' }));
      return;
    }

    setSyncState((prev) => ({ ...prev, syncStatus: 'syncing' }));

    const payload = {
      messages: getStoredMessages(),
      tasks: getStoredTasks(),
      reminders: getStoredReminders(),
      preferences: getStoredPreferences(),
      moods: getStoredMoods(),
    };

    const success = await pushSync(payload);
    if (success) {
      clearPendingSync();
      setSyncState((prev) => ({
        ...prev,
        syncStatus: 'synced',
        lastSyncedAt: new Date().toLocaleTimeString(),
        pendingChangesCount: 0,
      }));
    } else {
      setSyncState((prev) => ({ ...prev, syncStatus: 'error' }));
    }
  }, []);

  // Handle user sending a message or executing a task command
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      synced: false,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);
    setIsLoading(true);

    try {
      // 1. Check if the input is a direct system command (App, Battery, Device info, Download zip)
      const commandResult = await parseAndExecuteCommand(text, preferences.userName);

      if (commandResult.isCommand) {
        if (commandResult.task) {
          const updatedTasks = [commandResult.task, ...tasks];
          setTasks(updatedTasks);
          saveTasks(updatedTasks);
        }

        if (commandResult.triggerZipDownload) {
          const link = document.createElement('a');
          link.href = '/api/download-zip';
          link.download = 'riya_ai.zip';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        if (commandResult.externalUrl) {
          window.open(commandResult.externalUrl, '_blank', 'noopener,noreferrer');
        }

        const modelMessage: ChatMessage = {
          id: `mod-${Date.now()}`,
          role: 'model',
          text: commandResult.replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isTaskExecution: true,
          taskDetails: {
            action: commandResult.actionTaken || 'Command Executed',
            status: 'success',
          },
          synced: false,
        };

        const finalMessages = [...updatedMessages, modelMessage];
        setMessages(finalMessages);
        saveMessages(finalMessages);

        if (preferences.autoVoiceReply) {
          speakText(commandResult.replyText, undefined, undefined, preferences.voiceVoiceName);
        }

        setIsLoading(false);
        return;
      }

      // 2. Not a direct device command - Send to Gemini AI model
      let mode: 'general' | 'fast' | 'complex' = 'general';
      if (preferences.activeModel === 'gemini-3.1-flash-lite') {
        mode = 'fast';
      } else if (preferences.activeModel === 'gemini-3.8-flash-thinking') {
        mode = 'complex';
      }

      const res = await sendChatMessage({
        message: text,
        history: updatedMessages.slice(-6),
        mode,
        searchGrounding: preferences.searchGrounding,
        userName: preferences.userName,
        customPrompt: `Personality tone: ${preferences.personality}. Relationship: ${preferences.relationship}.`,
      });

      const modelMessage: ChatMessage = {
        id: `mod-${Date.now()}`,
        role: 'model',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: res.modelUsed || preferences.activeModel,
        groundingChunks: res.groundingChunks || [],
        synced: false,
      };

      const finalMessages = [...updatedMessages, modelMessage];
      setMessages(finalMessages);
      saveMessages(finalMessages);

      if (preferences.autoVoiceReply) {
        speakText(res.reply, undefined, undefined, preferences.voiceVoiceName);
      }
    } catch (err) {
      console.error('Failed to handle message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (confirm('Clear entire conversation history with Riya?')) {
      const resetMessages: ChatMessage[] = [
        {
          id: `welcome-${Date.now()}`,
          role: 'model',
          text: `Chat reset! Namaste ${preferences.userName} 💜 Main aapki Riya hoon. Boliye ab kya karein?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          synced: true,
        },
      ];
      setMessages(resetMessages);
      saveMessages(resetMessages);
    }
  };

  const handleAddTask = (task: TaskItem) => {
    const updated = [task, ...tasks];
    setTasks(updated);
    saveTasks(updated);
  };

  const handleAddReminder = (reminder: ReminderItem) => {
    const updated = [reminder, ...reminders];
    setReminders(updated);
    saveReminders(updated);
  };

  const handleToggleReminder = (id: string) => {
    const updated = reminders.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r));
    setReminders(updated);
    saveReminders(updated);
  };

  const handleUpdatePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  const lastModelReply = messages.filter((m) => m.role === 'model').slice(-1)[0]?.text;

  return (
    <div className="min-h-screen bg-[#0d0614] text-[#f3e8ff] flex flex-col items-center justify-start overflow-x-hidden">
      {/* Mobile-contained app container */}
      <div className="w-full max-w-lg min-h-screen relative flex flex-col bg-[#11071f]/80 shadow-[0_0_60px_rgba(112,26,179,0.25)] border-x border-purple-950/40">
        {/* App Header */}
        <Header
          onOpenSettings={() => setActiveTab('profile')}
          syncState={syncState}
          onTriggerSync={triggerCloudSync}
          batteryLevel={batteryLevel}
        />

        {/* Tab View Container */}
        <main className="flex-1 w-full p-2.5 overflow-y-auto">
          {activeTab === 'home' && (
            <HomeTab
              onNavigateTab={(tab) => setActiveTab(tab)}
              onSendMessage={(msg) => {
                setActiveTab('chat');
                handleSendMessage(msg);
              }}
              onVoiceClick={() => setActiveTab('voice')}
              preferences={preferences}
            />
          )}

          {activeTab === 'chat' && (
            <ChatTab
              messages={messages}
              onSendMessage={handleSendMessage}
              onClearChat={handleClearChat}
              onVoiceClick={() => setActiveTab('voice')}
              isLoading={isLoading}
              preferences={preferences}
              onChangeModel={(model) => handleUpdatePreferences({ ...preferences, activeModel: model })}
              onToggleSearchGrounding={() =>
                handleUpdatePreferences({
                  ...preferences,
                  searchGrounding: !preferences.searchGrounding,
                })
              }
            />
          )}

          {activeTab === 'voice' && (
            <VoiceTab
              onSendMessage={(spokenText) => {
                handleSendMessage(spokenText);
              }}
              preferences={preferences}
              lastReplyText={lastModelReply}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksTab
              tasks={tasks}
              onAddTask={handleAddTask}
              reminders={reminders}
              onAddReminder={handleAddReminder}
              onToggleReminder={handleToggleReminder}
              onExecuteCommand={(cmd) => {
                setActiveTab('chat');
                handleSendMessage(cmd);
              }}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileTab
              preferences={preferences}
              onUpdatePreferences={handleUpdatePreferences}
              syncState={syncState}
              onTriggerSync={triggerCloudSync}
            />
          )}
        </main>

        {/* Bottom Navigation matching screenshot */}
        <BottomNav activeTab={activeTab} onChangeTab={(tab) => setActiveTab(tab)} />
      </div>
    </div>
  );
}
