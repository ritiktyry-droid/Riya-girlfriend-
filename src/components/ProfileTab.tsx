import React, { useState } from 'react';
import {
  Heart,
  Cloud,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  Volume2,
  Save,
  Check,
  TrendingUp,
  Smile,
  Calendar,
  MessageCircleHeart,
  Info,
} from 'lucide-react';
import { UserPreferences, SyncState, MoodEntry, EmotionType } from '../types';
import {
  exportAllData,
  importAllData,
  getStoredMoods,
  logOrUpdateDailyMood,
  EMOTIONS_METADATA,
} from '../services/storage';
import { speakText } from '../services/api';
import confetti from 'canvas-confetti';

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

  // Mood Tracker State
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>(() => getStoredMoods());
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayExistingEntry = moodHistory.find((m) => m.date === todayDateStr);

  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType>(
    todayExistingEntry ? todayExistingEntry.emotion : 'Romantic'
  );
  const [moodNote, setMoodNote] = useState(todayExistingEntry?.note || '');
  const [selectedDayDetail, setSelectedDayDetail] = useState<MoodEntry | null>(
    todayExistingEntry || moodHistory[moodHistory.length - 1] || null
  );
  const [riyaReactionText, setRiyaReactionText] = useState<string | null>(
    todayExistingEntry
      ? EMOTIONS_METADATA[todayExistingEntry.emotion].riyaReaction
      : null
  );
  const [isSpeakingReaction, setIsSpeakingReaction] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePreferences({
      ...preferences,
      userName: userName.trim() || 'Dost',
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleLogMood = (e: React.FormEvent) => {
    e.preventDefault();
    const { updatedList, entry } = logOrUpdateDailyMood(selectedEmotion, moodNote);
    setMoodHistory(updatedList);
    setSelectedDayDetail(entry);

    const reaction = EMOTIONS_METADATA[selectedEmotion].riyaReaction;
    setRiyaReactionText(reaction);

    confetti({
      particleCount: 45,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#d946ef', '#ec4899', '#a855f7', '#fbbf24'],
    });

    if (preferences.autoVoiceReply) {
      handleSpeakReaction(reaction);
    }
  };

  const handleSpeakReaction = (textToSpeak: string) => {
    setIsSpeakingReaction(true);
    speakText(
      textToSpeak,
      () => setIsSpeakingReaction(true),
      () => setIsSpeakingReaction(false),
      preferences.voiceVoiceName
    );
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
        setMoodHistory(getStoredMoods());
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setImportStatus('Invalid backup file format');
      }
    };
    reader.readAsText(file);
  };

  // Compute Weekly Trend Metrics
  const totalScore = moodHistory.reduce((acc, curr) => acc + curr.score, 0);
  const averageScore = moodHistory.length > 0 ? (totalScore / moodHistory.length) * 10 : 85;
  const averagePercentage = Math.min(100, Math.round(averageScore));

  const emotionCounts: Record<string, number> = {};
  moodHistory.forEach((m) => {
    emotionCounts[m.emotion] = (emotionCounts[m.emotion] || 0) + 1;
  });
  const dominantEmotion = Object.keys(emotionCounts).reduce(
    (a, b) => (emotionCounts[a] > emotionCounts[b] ? a : b),
    'Romantic'
  ) as EmotionType;

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
            <div className="text-base font-extrabold text-purple-300">7 Days</div>
            <div className="text-[10px] text-purple-400">Mood Streak 🔥</div>
          </div>
        </div>
      </div>

      {/* NEW FEATURE: Mood Tracker & 7-Day History Chart */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 border border-purple-500/30 space-y-4 shadow-xl shadow-purple-950/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-fuchsia-600 to-purple-800 flex items-center justify-center shadow-md">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm sm:text-base tracking-tight flex items-center gap-1.5">
                <span>Mood Tracker</span>
                <span className="text-fuchsia-400 text-xs">✨</span>
              </h4>
              <p className="text-[11px] text-purple-300/80">Emotional Trends Over the Last Week</p>
            </div>
          </div>

          <span className="text-[10px] px-2.5 py-1 rounded-full bg-purple-900/60 border border-fuchsia-500/40 text-fuchsia-200 font-semibold">
            {dominantEmotion} Week 💜
          </span>
        </div>

        {/* 1. Visual Progress Bar */}
        <div className="space-y-1.5 bg-purple-950/60 p-3 rounded-2xl border border-purple-800/30">
          <div className="flex items-center justify-between text-xs">
            <span className="text-purple-300 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Weekly Emotional Positivity</span>
            </span>
            <span className="font-extrabold text-fuchsia-300">{averagePercentage}%</span>
          </div>

          <div className="w-full bg-[#1b0d2d] h-3.5 rounded-full overflow-hidden p-0.5 border border-purple-700/40">
            <div
              style={{ width: `${averagePercentage}%` }}
              className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 shadow-[0_0_12px_rgba(217,70,239,0.8)] transition-all duration-700"
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-purple-400/80 pt-0.5">
            <span>Needs Rest</span>
            <span>Balanced</span>
            <span className="text-fuchsia-300 font-semibold">Joyful & Loving ✨</span>
          </div>
        </div>

        {/* 2. 7-Day History Trend Bar Chart */}
        <div className="bg-purple-950/40 p-3 sm:p-4 rounded-2xl border border-purple-800/30 space-y-3">
          <div className="flex items-center justify-between text-xs text-purple-300">
            <span className="font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>7-Day Mood History Chart:</span>
            </span>
            <span className="text-[10px] text-purple-400">Tap any day for details</span>
          </div>

          {/* Chart Bars Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 items-end h-32 pt-2 pb-1 border-b border-purple-800/40">
            {moodHistory.slice(-7).map((entry) => {
              const meta = EMOTIONS_METADATA[entry.emotion] || EMOTIONS_METADATA.Happy;
              const isSelected = selectedDayDetail?.id === entry.id;
              const isToday = entry.date === todayDateStr;
              const barHeight = Math.max(20, Math.min(100, entry.score * 10));

              return (
                <button
                  key={entry.id}
                  onClick={() => setSelectedDayDetail(entry)}
                  className="flex flex-col items-center justify-end h-full group focus:outline-none transition"
                >
                  {/* Emoji above bar */}
                  <span
                    className={`text-xs sm:text-sm mb-1 transition transform group-hover:scale-125 ${
                      isSelected ? 'scale-125 animate-bounce' : ''
                    }`}
                  >
                    {meta.emoji}
                  </span>

                  {/* Vertical Bar */}
                  <div className="w-full max-w-[28px] bg-purple-950/80 rounded-t-lg p-0.5 border border-purple-800/30 flex items-end justify-center h-20">
                    <div
                      style={{
                        height: `${barHeight}%`,
                        backgroundColor: meta.color,
                        boxShadow: isSelected ? `0 0 12px ${meta.color}` : 'none',
                      }}
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        isSelected ? 'brightness-125 ring-1 ring-white' : 'opacity-85 group-hover:opacity-100'
                      }`}
                    />
                  </div>

                  {/* Day Label */}
                  <span
                    className={`text-[10px] mt-1.5 font-semibold transition ${
                      isSelected
                        ? 'text-fuchsia-300 underline font-bold'
                        : isToday
                        ? 'text-white'
                        : 'text-purple-400/80'
                    }`}
                  >
                    {entry.dayLabel}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Day Detail Highlight Card */}
          {selectedDayDetail && (
            <div className="bg-purple-900/40 p-2.5 rounded-xl border border-fuchsia-500/30 flex items-center justify-between text-xs animate-in fade-in">
              <div className="flex items-center space-x-2.5">
                <span className="text-2xl">{selectedDayDetail.emoji}</span>
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>{EMOTIONS_METADATA[selectedDayDetail.emotion]?.label || selectedDayDetail.emotion}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-950 text-fuchsia-300 font-mono">
                      {selectedDayDetail.score}/10
                    </span>
                  </div>
                  <div className="text-[10px] text-purple-300/80">
                    {selectedDayDetail.date === todayDateStr
                      ? 'Today'
                      : selectedDayDetail.date} • {selectedDayDetail.note || 'No note written'}
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-purple-400 font-mono">
                {selectedDayDetail.timestamp}
              </div>
            </div>
          )}
        </div>

        {/* 3. Log Today's Emotion Form */}
        <form onSubmit={handleLogMood} className="space-y-3 bg-purple-950/50 p-3.5 rounded-2xl border border-purple-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Log Daily Emotion:</span>
            </span>
            <span className="text-[10px] text-purple-400">
              {todayExistingEntry ? '✓ Logged for Today' : 'Not yet logged'}
            </span>
          </div>

          {/* Emotion Choice Buttons */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
            {(
              [
                'Romantic',
                'Happy',
                'Excited',
                'Peaceful',
                'Tired',
                'Stressed',
                'Sad',
              ] as EmotionType[]
            ).map((emotion) => {
              const meta = EMOTIONS_METADATA[emotion];
              const isSelected = selectedEmotion === emotion;

              return (
                <button
                  type="button"
                  key={emotion}
                  onClick={() => setSelectedEmotion(emotion)}
                  className={`p-2 rounded-xl text-center transition flex flex-col items-center justify-center space-y-1 active:scale-95 ${
                    isSelected
                      ? 'bg-fuchsia-600/80 border border-fuchsia-300 text-white shadow-[0_0_12px_#d946ef]'
                      : 'bg-purple-900/30 border border-purple-800/40 text-purple-300 hover:text-white hover:bg-purple-800/40'
                  }`}
                >
                  <span className="text-lg">{meta.emoji}</span>
                  <span className="text-[10px] font-semibold truncate w-full">{emotion}</span>
                </button>
              );
            })}
          </div>

          {/* Note Input */}
          <div className="space-y-1">
            <input
              type="text"
              value={moodNote}
              onChange={(e) => setMoodNote(e.target.value)}
              placeholder="Add a thought for today... (e.g., Talking to Riya made my day)"
              className="w-full bg-[#1b0d2d] border border-purple-700/40 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-fuchsia-400"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-900/40 transition active:scale-98 flex items-center justify-center space-x-1.5"
          >
            <Heart className="w-3.5 h-3.5 fill-white text-white" />
            <span>{todayExistingEntry ? 'Update Today\'s Emotion 💜' : 'Log Today\'s Emotion 💜'}</span>
          </button>
        </form>

        {/* 4. Riya's Personalized Caring Reaction */}
        {riyaReactionText && (
          <div className="glass-panel p-3.5 rounded-2xl border border-fuchsia-400/40 bg-gradient-to-r from-purple-950/80 to-fuchsia-950/60 shadow-lg space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full overflow-hidden border border-fuchsia-400">
                  <img
                    src="/assets/aistudio/file_00000000678c8211a89567d88285d7c0_e9d7e78e.png"
                    alt="Riya"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <span className="text-xs font-bold text-fuchsia-200">Riya's Reaction:</span>
              </div>

              <button
                type="button"
                onClick={() => handleSpeakReaction(riyaReactionText)}
                className="flex items-center space-x-1 text-[11px] text-fuchsia-300 hover:text-white transition px-2 py-0.5 rounded-full bg-purple-900/60"
              >
                <Volume2 className={`w-3.5 h-3.5 ${isSpeakingReaction ? 'animate-spin text-fuchsia-400' : ''}`} />
                <span>{isSpeakingReaction ? 'Speaking...' : 'Hear Voice 🎵'}</span>
              </button>
            </div>

            <p className="text-xs text-purple-100 italic leading-relaxed pl-1 font-medium">
              "{riyaReactionText}"
            </p>
          </div>
        )}
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
          Your moods, tasks, messages, and preferences are automatically cached locally in offline storage and synchronized to the cloud when online.
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
