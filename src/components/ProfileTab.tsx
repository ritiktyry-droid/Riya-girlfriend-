import React, { useState } from 'react';
import {
  Heart,
  Cloud,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  Volume2,
  Shield,
  Smartphone,
  Save,
  Check,
} from 'lucide-react';
import { UserPreferences, SyncState } from '../types';
import { exportAllData, importAllData } from '../services/storage';

interface ProfileTabProps {
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: UserPreferences) => void;
  syncState: SyncState;
  onTriggerSync: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  preferences,
  onUpdatePreferences,
  syncState,
  onTriggerSync,
}) => {
  const [userName, setUserName] = useState(preferences.userName);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePreferences({
      ...preferences,
      userName: userName.trim() || 'Dost',
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleExportData = () => {
    const jsonStr = exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `riya_ai_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importAllData(content);
      if (success) {
        setImportStatus('Backup restored successfully!');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setImportStatus('Invalid backup file format');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] pb-24 px-2 space-y-4 select-none">
      {/* Profile Card with Riya Avatar */}
      <div className="glass-card rounded-3xl p-5 border border-purple-500/30 flex flex-col items-center text-center relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-pink-500 shadow-[0_0_25px_rgba(217,70,239,0.5)] mb-3">
          <div className="w-full h-full rounded-full overflow-hidden border-2 border-purple-900">
            <img
              src="/assets/aistudio/file_00000000678c8211a89567d88285d7c0_e9d7e78e.png"
              alt="Riya"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="absolute -bottom-1 right-1 w-7 h-7 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-xs text-white shadow-md border-2 border-purple-950">
            💜
          </div>
        </div>

        <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
          <span>Riya</span>
          <span className="text-fuchsia-400 text-sm">✨</span>
        </h3>
        <p className="text-xs text-fuchsia-300 font-medium">Your Virtual Companion & AI Assistant</p>

        {/* Affinity and Bond Stats */}
        <div className="grid grid-cols-3 gap-2 w-full mt-4 pt-3 border-t border-purple-800/40 text-center">
          <div className="bg-purple-950/50 p-2 rounded-2xl border border-purple-800/20">
            <div className="text-base font-extrabold text-fuchsia-300">99.8%</div>
            <div className="text-[10px] text-purple-400">Affinity Score</div>
          </div>
          <div className="bg-purple-950/50 p-2 rounded-2xl border border-purple-800/20">
            <div className="text-base font-extrabold text-pink-300">Infinite</div>
            <div className="text-[10px] text-purple-400">Loyalty</div>
          </div>
          <div className="bg-purple-950/50 p-2 rounded-2xl border border-purple-800/20">
            <div className="text-base font-extrabold text-purple-300">Active</div>
            <div className="text-[10px] text-purple-400">Cloud Sync</div>
          </div>
        </div>
      </div>

      {/* Cloud Synchronization Panel */}
      <div className="glass-card rounded-2xl p-4 border border-purple-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cloud className="w-5 h-5 text-fuchsia-400" />
            <h4 className="font-bold text-white text-sm">Cloud Sync & Offline State</h4>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              syncState.isOnline
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-950 text-amber-300 border border-amber-500/40'
            }`}
          >
            {syncState.isOnline ? 'Online Synced' : 'Offline Mode'}
          </span>
        </div>

        <p className="text-xs text-purple-200/80 leading-relaxed">
          Your tasks, messages, and preferences are automatically cached locally in offline storage and synchronized to the cloud when online.
        </p>

        <div className="flex space-x-2">
          <button
            onClick={onTriggerSync}
            disabled={syncState.syncStatus === 'syncing'}
            className="flex-1 py-2 rounded-xl bg-purple-700/60 hover:bg-purple-600/70 text-white font-semibold text-xs border border-purple-400/30 transition flex items-center justify-center space-x-1.5"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${syncState.syncStatus === 'syncing' ? 'animate-spin' : ''}`}
            />
            <span>{syncState.syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}</span>
          </button>

          <button
            onClick={handleExportData}
            className="px-3.5 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 hover:text-white font-semibold text-xs border border-purple-700/40 transition flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          <label className="px-3.5 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 hover:text-white font-semibold text-xs border border-purple-700/40 transition flex items-center space-x-1 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>
        </div>

        {importStatus && (
          <div className="text-xs text-fuchsia-300 bg-purple-950/60 p-2 rounded-xl text-center">
            {importStatus}
          </div>
        )}
      </div>

      {/* User Customization Form */}
      <form onSubmit={handleSaveProfile} className="glass-card rounded-2xl p-4 border border-purple-500/30 space-y-3.5">
        <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-fuchsia-400" />
          <span>Personality & Address</span>
        </h4>

        <div className="space-y-1.5">
          <label className="text-xs text-purple-300 font-medium">How should Riya address you?</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="e.g. Dost, Jaan, Alex"
            className="w-full bg-purple-950/60 border border-purple-700/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fuchsia-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-purple-300 font-medium">Personality Mode</label>
          <div className="grid grid-cols-2 gap-2">
            {(['Sweet & Caring', 'Playful & Flirty', 'Smart & Professional', 'Cheerleader'] as const).map(
              (p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => onUpdatePreferences({ ...preferences, personality: p })}
                  className={`p-2 rounded-xl text-xs font-semibold border transition text-left ${
                    preferences.personality === p
                      ? 'bg-fuchsia-700/70 border-fuchsia-400 text-white shadow-md'
                      : 'bg-purple-950/50 border-purple-800 text-purple-300 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-purple-300 font-medium">Voice Model Tone</label>
          <div className="grid grid-cols-3 gap-2">
            {(['Kore', 'Zephyr', 'Aoede'] as const).map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => onUpdatePreferences({ ...preferences, voiceVoiceName: v })}
                className={`p-2 rounded-xl text-xs font-semibold border transition text-center ${
                  preferences.voiceVoiceName === v
                    ? 'bg-purple-700 border-purple-400 text-white'
                    : 'bg-purple-950/50 border-purple-800 text-purple-300 hover:text-white'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-purple-300">Speak replies automatically</span>
          <input
            type="checkbox"
            checked={preferences.autoVoiceReply}
            onChange={(e) =>
              onUpdatePreferences({ ...preferences, autoVoiceReply: e.target.checked })
            }
            className="w-4 h-4 accent-fuchsia-500 rounded cursor-pointer"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold text-xs shadow-lg transition active:scale-98 flex items-center justify-center space-x-1.5"
        >
          {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{savedSuccess ? 'Preferences Saved!' : 'Save Preferences'}</span>
        </button>
      </form>
    </div>
  );
};
