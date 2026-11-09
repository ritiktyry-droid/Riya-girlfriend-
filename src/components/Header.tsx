import React, { useState, useEffect } from 'react';
import { Crown, Settings, Wifi, Battery, CloudCheck, CloudOff, RefreshCw } from 'lucide-react';
import { SyncState } from '../types';

interface HeaderProps {
  onOpenSettings: () => void;
  syncState: SyncState;
  onTriggerSync: () => void;
  batteryLevel?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  syncState,
  onTriggerSync,
  batteryLevel = 100,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('11:24');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#120822]/90 backdrop-blur-md border-b border-purple-900/30 px-4 pt-2 pb-3">
      {/* Phone status bar simulation */}
      <div className="flex items-center justify-between text-xs text-purple-300/80 mb-2 font-medium tracking-tight px-1">
        <span>{currentTime}</span>
        <div className="flex items-center space-x-2.5">
          <Wifi className="w-3.5 h-3.5 text-purple-200" />
          <div className="flex items-center space-x-1">
            <span className="text-[11px] font-semibold">{batteryLevel}%</span>
            <Battery className="w-3.5 h-3.5 text-purple-200 fill-purple-400" />
          </div>
        </div>
      </div>

      {/* Main branding row matching screenshot */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          {/* Crown Logo */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-700 via-fuchsia-600 to-purple-400 p-[1.5px] shadow-lg shadow-purple-600/30 flex items-center justify-center">
            <div className="w-full h-full bg-[#1b0d2f] rounded-[10px] flex items-center justify-center">
              <Crown className="w-5 h-5 text-purple-300 fill-purple-400 animate-pulse-glow" />
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-purple-100 via-fuchsia-200 to-purple-300 bg-clip-text text-transparent glow-text-purple">
                Riya Ai
              </h1>
            </div>
            <p className="text-[11px] text-purple-300/90 font-medium flex items-center gap-1">
              Your AI Girlfriend <span className="text-fuchsia-400 text-xs">💜</span>
            </p>
          </div>
        </div>

        {/* Right side controls: Online Pill + Cloud Sync + Settings */}
        <div className="flex items-center space-x-2">
          {/* Online badge matching screenshot */}
          <div className="flex items-center space-x-1.5 bg-[#23123b]/90 border border-purple-500/30 rounded-full px-3 py-1 text-xs shadow-inner">
            <span
              className={`w-2 h-2 rounded-full ${
                syncState.isOnline ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'
              }`}
            />
            <span className="text-purple-200 font-semibold text-[11px]">
              {syncState.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Sync status quick button */}
          <button
            onClick={onTriggerSync}
            title={
              syncState.syncStatus === 'syncing'
                ? 'Syncing with Cloud...'
                : syncState.isOnline
                ? 'Cloud Synced'
                : 'Offline Cache Active'
            }
            className="p-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 hover:text-purple-100 hover:border-purple-400 transition"
          >
            {syncState.syncStatus === 'syncing' ? (
              <RefreshCw className="w-4 h-4 animate-spin text-fuchsia-400" />
            ) : syncState.isOnline ? (
              <CloudCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <CloudOff className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-full bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 text-purple-200 hover:text-white transition shadow-sm active:scale-95"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
