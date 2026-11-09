import React from 'react';
import { Home, MessageCircle, Heart, User, Sparkles } from 'lucide-react';

export type NavTab = 'home' | 'chat' | 'voice' | 'tasks' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-lg mx-auto bg-[#100720]/95 backdrop-blur-xl border-t border-purple-900/40 px-6 py-2 select-none shadow-2xl">
      <div className="flex items-center justify-between">
        {/* 1. Home */}
        <button
          onClick={() => onChangeTab('home')}
          className={`flex flex-col items-center justify-center space-y-1 transition duration-200 active:scale-95 ${
            activeTab === 'home'
              ? 'text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.7)]'
              : 'text-purple-400/60 hover:text-purple-300'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] font-medium tracking-tight">Home</span>
        </button>

        {/* 2. Chat */}
        <button
          onClick={() => onChangeTab('chat')}
          className={`flex flex-col items-center justify-center space-y-1 transition duration-200 active:scale-95 ${
            activeTab === 'chat'
              ? 'text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.7)]'
              : 'text-purple-400/60 hover:text-purple-300'
          }`}
        >
          <MessageCircle className={`w-5 h-5 ${activeTab === 'chat' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] font-medium tracking-tight">Chat</span>
        </button>

        {/* 3. Voice (Heart icon matching screenshot!) */}
        <button
          onClick={() => onChangeTab('voice')}
          className={`flex flex-col items-center justify-center space-y-1 transition duration-200 active:scale-95 ${
            activeTab === 'voice'
              ? 'text-fuchsia-400 drop-shadow-[0_0_10px_rgba(217,70,239,0.9)] scale-105'
              : 'text-purple-400/60 hover:text-purple-300'
          }`}
        >
          <div className="relative">
            <Heart
              className={`w-5 h-5 ${
                activeTab === 'voice'
                  ? 'fill-fuchsia-500 text-fuchsia-400 animate-pulse'
                  : 'stroke-2'
              }`}
            />
          </div>
          <span className="text-[11px] font-medium tracking-tight">Voice</span>
        </button>

        {/* 4. Profile / Settings */}
        <button
          onClick={() => onChangeTab('profile')}
          className={`flex flex-col items-center justify-center space-y-1 transition duration-200 active:scale-95 ${
            activeTab === 'profile'
              ? 'text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.7)]'
              : 'text-purple-400/60 hover:text-purple-300'
          }`}
        >
          <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] font-medium tracking-tight">Profile</span>
        </button>
      </div>
    </nav>
  );
};
