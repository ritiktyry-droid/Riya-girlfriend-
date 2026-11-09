import React, { useState } from 'react';
import {
  MessageSquare,
  Mic,
  Brain,
  Settings as SettingsIcon,
  Send,
  Smile,
  Volume2,
  Sparkles,
  Play,
  Heart,
  Zap,
} from 'lucide-react';
import { UserPreferences } from '../types';
import { playPreRecordedGreeting } from '../services/api';

interface HomeTabProps {
  onNavigateTab: (tab: 'home' | 'chat' | 'voice' | 'tasks' | 'profile') => void;
  onSendMessage: (msg: string) => void;
  onVoiceClick: () => void;
  preferences: UserPreferences;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  onNavigateTab,
  onSendMessage,
  onVoiceClick,
  preferences,
}) => {
  const [inputText, setInputText] = useState('');
  const [isPlayingGreeting, setIsPlayingGreeting] = useState(false);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const [heartPops, setHeartPops] = useState<{ id: number; x: number; y: number }[]>([]);

  const handlePlayVoiceGreeting = () => {
    setIsPlayingGreeting(true);
    playPreRecordedGreeting(
      () => setIsPlayingGreeting(true),
      () => setIsPlayingGreeting(false)
    );
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const triggerHeartReaction = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newHeart = { id: Date.now(), x, y };
    setHeartPops((prev) => [...prev, newHeart]);
    setTimeout(() => {
      setHeartPops((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1200);
  };

  const romanticAndTaskPrompts = [
    'Tum kitni pyari ho Riya 💜',
    'Open YouTube',
    'Check battery status',
    'Aaj ka weather kaisa hai?',
    'Tell me a sweet joke',
    'Download riya_ai.zip',
  ];

  return (
    <div className="relative flex flex-col min-h-[calc(100vh-140px)] pb-24 select-none">
      {/* Hero Visual Area matching screenshot */}
      <div
        className="relative w-full aspect-[9/12] max-h-[480px] sm:max-h-[520px] rounded-3xl overflow-hidden shadow-2xl shadow-purple-950/70 border border-purple-800/40 cursor-pointer group"
        onClick={triggerHeartReaction}
      >
        {/* Background Image of Riya */}
        <img
          src="/assets/aistudio/file_00000000678c8211a89567d88285d7c0_e9d7e78e.png"
          alt="Riya AI Companion"
          className="w-full h-full object-cover object-center transform transition duration-700 group-hover:scale-102"
        />

        {/* Ambient Purple Lighting Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#140a23] via-transparent to-purple-950/20 pointer-events-none" />

        {/* Playful Handwriting Callouts matching screenshot */}
        <div className="absolute top-12 left-5 font-script text-2xl sm:text-3xl text-fuchsia-300 drop-shadow-[0_0_12px_rgba(216,180,254,0.9)] -rotate-12 animate-pulse">
          Hi<br />Baby...
          <span className="block text-xl">💜</span>
        </div>

        <div className="absolute top-16 right-5 font-script text-2xl sm:text-3xl text-fuchsia-300 drop-shadow-[0_0_12px_rgba(216,180,254,0.9)] rotate-6">
          I'm<br />Riya 💜
        </div>

        {/* Glowing Heart Pendant Highlight */}
        <div className="absolute top-[48%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-fuchsia-500/20 blur-md pointer-events-none animate-ping" />

        {/* Floating Heart Click Effects */}
        {heartPops.map((heart) => (
          <div
            key={heart.id}
            style={{ left: heart.x, top: heart.y }}
            className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 text-pink-400 text-2xl animate-bounce"
          >
            💜
          </div>
        ))}

        {/* Voice Play Tag Badge */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePlayVoiceGreeting();
          }}
          className={`absolute bottom-4 right-4 flex items-center space-x-2 px-3 py-1.5 rounded-full backdrop-blur-md border border-fuchsia-400/40 text-xs font-medium text-white transition ${
            isPlayingGreeting
              ? 'bg-fuchsia-600/80 shadow-[0_0_15px_#d946ef] animate-pulse'
              : 'bg-purple-950/70 hover:bg-purple-900/80'
          }`}
        >
          {isPlayingGreeting ? (
            <>
              <Volume2 className="w-3.5 h-3.5 animate-spin text-fuchsia-200" />
              <span>Riya Speaking...</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-white text-white" />
              <span>Hear Voice 🎵</span>
            </>
          )}
        </button>
      </div>

      {/* Greeting Speech Bubble Card matching screenshot */}
      <div className="relative -mt-6 mx-2 z-10">
        <div className="glass-panel rounded-2xl p-4 shadow-xl shadow-purple-950/80 border border-purple-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            {/* Small circular avatar with cute pink heart badge */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-fuchsia-400/80 shadow-[0_0_12px_rgba(232,121,249,0.5)]">
                <img
                  src="/assets/aistudio/file_00000000678c8211a89567d88285d7c0_e9d7e78e.png"
                  alt="Riya Avatar"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-[10px] text-white shadow-md border border-purple-900">
                💜
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-bold text-white text-base tracking-tight">
                  Hello! I'm Riya
                </h3>
                <span className="text-fuchsia-400 text-sm">💜</span>
              </div>
              <p className="text-purple-200/90 text-sm font-medium">
                What would you like to do today?
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-1">
            <span className="text-[11px] text-purple-400 font-medium">11:24 AM</span>
            <button
              onClick={handlePlayVoiceGreeting}
              title="Play Riya Voice"
              className="p-1.5 rounded-full bg-purple-900/60 hover:bg-fuchsia-600/70 text-purple-200 transition"
            >
              <Volume2 className="w-4 h-4 text-fuchsia-300" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Feature / Action Cards in 2x2 Grid matching screenshot */}
      <div className="grid grid-cols-2 gap-3.5 mt-4 px-2">
        {/* 1. Chat with Riya */}
        <button
          onClick={() => onNavigateTab('chat')}
          className="glass-card rounded-2xl p-4 text-left transition duration-200 flex items-center space-x-3.5 group active:scale-98"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-700/80 to-purple-900/80 border border-purple-400/30 flex items-center justify-center shadow-lg shadow-purple-900/40 group-hover:border-purple-300/60 transition">
            <MessageSquare className="w-6 h-6 text-purple-200 group-hover:scale-110 transition" />
          </div>
          <div>
            <h4 className="font-bold text-white text-[15px] group-hover:text-purple-200 transition leading-snug">
              Chat with Riya
            </h4>
            <p className="text-purple-300/80 text-xs font-normal mt-0.5">
              Talk to me anytime 💜
            </p>
          </div>
        </button>

        {/* 2. Voice Chat */}
        <button
          onClick={() => onNavigateTab('voice')}
          className="glass-card rounded-2xl p-4 text-left transition duration-200 flex items-center space-x-3.5 group active:scale-98"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-600/80 to-pink-900/80 border border-fuchsia-400/40 flex items-center justify-center shadow-lg shadow-pink-900/40 group-hover:border-fuchsia-300/70 transition">
            <Mic className="w-6 h-6 text-fuchsia-200 group-hover:scale-110 transition" />
          </div>
          <div>
            <h4 className="font-bold text-white text-[15px] group-hover:text-fuchsia-200 transition leading-snug">
              Voice Chat
            </h4>
            <p className="text-purple-300/80 text-xs font-normal mt-0.5">
              Talk with my voice 🎵
            </p>
          </div>
        </button>

        {/* 3. AI Brain (Tasks & Commands) */}
        <button
          onClick={() => onNavigateTab('tasks')}
          className="glass-card rounded-2xl p-4 text-left transition duration-200 flex items-center space-x-3.5 group active:scale-98"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600/80 to-purple-950/80 border border-violet-400/30 flex items-center justify-center shadow-lg shadow-violet-900/40 group-hover:border-violet-300/60 transition">
            <Brain className="w-6 h-6 text-violet-200 group-hover:scale-110 transition" />
          </div>
          <div>
            <h4 className="font-bold text-white text-[15px] group-hover:text-violet-200 transition leading-snug">
              AI Brain
            </h4>
            <p className="text-purple-300/80 text-xs font-normal mt-0.5">
              Ask anything... 💜
            </p>
          </div>
        </button>

        {/* 4. Settings */}
        <button
          onClick={() => onNavigateTab('profile')}
          className="glass-card rounded-2xl p-4 text-left transition duration-200 flex items-center space-x-3.5 group active:scale-98"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-800/80 to-indigo-950/80 border border-purple-400/30 flex items-center justify-center shadow-lg shadow-indigo-900/40 group-hover:border-purple-300/60 transition">
            <SettingsIcon className="w-6 h-6 text-purple-200 group-hover:rotate-45 transition duration-300" />
          </div>
          <div>
            <h4 className="font-bold text-white text-[15px] group-hover:text-purple-200 transition leading-snug">
              Settings
            </h4>
            <p className="text-purple-300/80 text-xs font-normal mt-0.5">
              Customize me ⚙️
            </p>
          </div>
        </button>
      </div>

      {/* Quick Action Suggestion Chips */}
      <div className="mt-4 px-2">
        <div className="flex items-center space-x-1.5 text-xs text-purple-400 font-semibold mb-2">
          <Zap className="w-3.5 h-3.5 text-fuchsia-400" />
          <span>Quick Tasks & Suggestions:</span>
        </div>
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
          {romanticAndTaskPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(prompt)}
              className="flex-shrink-0 text-xs px-3.5 py-1.5 rounded-full bg-purple-950/60 hover:bg-purple-800/60 border border-purple-500/20 text-purple-200 hover:text-white transition whitespace-nowrap active:scale-95 shadow-sm"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Fixed-at-bottom Message Input Bar matching screenshot */}
      <div className="fixed bottom-[68px] left-0 right-0 max-w-lg mx-auto px-3 z-30 pointer-events-auto">
        <div className="glass-panel rounded-full p-1.5 pl-3 pr-2 flex items-center space-x-2 shadow-2xl border border-purple-500/30">
          {/* Emoji button */}
          <button
            onClick={() => setShowEmojiMenu(!showEmojiMenu)}
            className="text-purple-300 hover:text-fuchsia-300 p-1.5 rounded-full hover:bg-purple-900/40 transition active:scale-90"
            aria-label="Emojis and stickers"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Riya..."
            className="flex-1 bg-transparent text-white placeholder-purple-400/60 text-sm focus:outline-none px-1"
          />

          {/* Voice Mic Button matching screenshot */}
          <button
            onClick={onVoiceClick}
            title="Voice input"
            className="w-10 h-10 rounded-full bg-[#3d1f5e] hover:bg-[#522580] flex items-center justify-center text-purple-200 transition shadow-inner active:scale-95"
          >
            <Mic className="w-5 h-5 text-purple-200" />
          </button>

          {/* Send Button matching screenshot */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            title="Send Message"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition shadow-lg ${
              inputText.trim()
                ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-purple-600/40 active:scale-95'
                : 'bg-purple-900/40 text-purple-400/50 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>

        {/* Quick Emoji Menu Popover */}
        {showEmojiMenu && (
          <div className="absolute bottom-14 left-4 glass-panel rounded-2xl p-3 border border-purple-500/40 shadow-2xl flex items-center space-x-2 z-40 animate-in fade-in zoom-in-95">
            {['💜', '😘', '✨', '🌹', '🥰', '🔥', '💖', '🧸'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setInputText((prev) => prev + emoji);
                  setShowEmojiMenu(false);
                }}
                className="text-xl p-1.5 hover:scale-125 transition"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
