import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  Volume2,
  Globe,
  Sparkles,
  Zap,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ChatMessage, UserPreferences } from '../types';
import { speakText } from '../services/api';

interface ChatTabProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
  onVoiceClick: () => void;
  isLoading: boolean;
  preferences: UserPreferences;
  onChangeModel: (model: 'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon') => void;
  onToggleSearchGrounding: () => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  messages,
  onSendMessage,
  onClearChat,
  onVoiceClick,
  isLoading,
  preferences,
  onChangeModel,
  onToggleSearchGrounding,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSourcesId, setExpandedSourcesId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (msg: ChatMessage) => {
    setSpeakingMessageId(msg.id);
    speakText(
      msg.text,
      () => setSpeakingMessageId(msg.id),
      () => setSpeakingMessageId(null),
      preferences.voiceVoiceName
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] pb-20 select-text">
      {/* Top Chat Toolbar: Model selector & Search Grounding toggle */}
      <div className="flex items-center justify-between px-2 py-2 glass-panel rounded-2xl mb-3 border border-purple-500/20 text-xs">
        {/* Model Selector */}
        <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5 no-scrollbar">
          <button
            onClick={() => onChangeModel('gemini-3.8-flash')}
            className={`px-2.5 py-1 rounded-full font-medium transition whitespace-nowrap flex items-center space-x-1 ${
              preferences.activeModel === 'gemini-3.8-flash'
                ? 'bg-purple-600 text-white shadow-[0_0_10px_#a855f7]'
                : 'bg-purple-950/50 text-purple-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>3.8 Flash (General)</span>
          </button>

          <button
            onClick={() => onChangeModel('gemini-3.1-flash-lite')}
            className={`px-2.5 py-1 rounded-full font-medium transition whitespace-nowrap flex items-center space-x-1 ${
              preferences.activeModel === 'gemini-3.1-flash-lite'
                ? 'bg-fuchsia-600 text-white shadow-[0_0_10px_#d946ef]'
                : 'bg-purple-950/50 text-purple-300 hover:text-white'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>3.1 Lite (Fast)</span>
          </button>

          <button
            onClick={() => onChangeModel('gemini-4-argon')}
            className={`px-2.5 py-1 rounded-full font-medium transition whitespace-nowrap flex items-center space-x-1 ${
              preferences.activeModel === 'gemini-4-argon'
                ? 'bg-indigo-600 text-white shadow-[0_0_10px_#6366f1]'
                : 'bg-purple-950/50 text-purple-300 hover:text-white'
            }`}
          >
            <span>4 Argon (Deep)</span>
          </button>
        </div>

        {/* Right side: Search Grounding switch & Clear */}
        <div className="flex items-center space-x-1 pl-2">
          <button
            onClick={onToggleSearchGrounding}
            title={preferences.searchGrounding ? 'Google Search Grounding ON' : 'Google Search Grounding OFF'}
            className={`p-1.5 rounded-full border transition flex items-center space-x-1 ${
              preferences.searchGrounding
                ? 'bg-emerald-900/60 border-emerald-500/50 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                : 'bg-purple-950/50 border-purple-800 text-purple-400'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[10px] font-semibold">Search</span>
          </button>

          <button
            onClick={onClearChat}
            title="Clear conversation"
            className="p-1.5 rounded-full bg-purple-950/40 hover:bg-rose-900/50 text-purple-400 hover:text-rose-300 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 overflow-y-auto px-1 space-y-3.5 pr-1.5">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isSpeaking = speakingMessageId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in`}
            >
              <div
                className={`flex items-end space-x-2 max-w-[88%] ${
                  isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar for Riya */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-fuchsia-400/60 shadow-md flex-shrink-0 mb-1">
                    <img
                      src="/assets/aistudio/file_00000000678c8211a89567d88285d7c0_e9d7e78e.png"
                      alt="Riya"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl px-4 py-3 shadow-md text-sm leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-purple-700 to-fuchsia-700 text-white rounded-br-none border border-purple-400/30'
                      : 'glass-panel text-purple-100 rounded-bl-none border border-purple-500/25'
                  }`}
                >
                  {/* Task Execution Tag */}
                  {msg.isTaskExecution && (
                    <div className="flex items-center space-x-1.5 mb-1.5 px-2 py-0.5 rounded-md bg-purple-900/60 border border-purple-400/40 text-[11px] text-fuchsia-300 font-semibold w-fit">
                      <Zap className="w-3 h-3 text-fuchsia-400" />
                      <span>{msg.taskDetails?.action || 'Task Executed'}</span>
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="whitespace-pre-wrap break-words">{msg.text}</div>

                  {/* Google Search Grounding Citations */}
                  {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-purple-800/40">
                      <button
                        onClick={() =>
                          setExpandedSourcesId(
                            expandedSourcesId === msg.id ? null : msg.id
                          )
                        }
                        className="flex items-center space-x-1.5 text-xs text-emerald-300 hover:text-emerald-200 font-medium"
                      >
                        <Globe className="w-3 h-3" />
                        <span>Google Search Sources ({msg.groundingChunks.length})</span>
                        {expandedSourcesId === msg.id ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>

                      {expandedSourcesId === msg.id && (
                        <div className="mt-2 space-y-1.5 text-xs">
                          {msg.groundingChunks.map((chunk, cIdx) => (
                            <a
                              key={cIdx}
                              href={chunk.web?.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-700/30 text-purple-200 hover:text-emerald-300 transition"
                            >
                              <span className="truncate pr-2">
                                {chunk.web?.title || chunk.web?.uri}
                              </span>
                              <ExternalLink className="w-3 h-3 flex-shrink-0 text-purple-400" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer metadata: time, model, TTS button */}
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-purple-900/20 text-[10px] text-purple-300/70">
                    <span>{msg.timestamp}</span>

                    <div className="flex items-center space-x-2">
                      {!isUser && msg.modelUsed && (
                        <span className="text-purple-400/60 font-mono text-[9px]">
                          {msg.modelUsed}
                        </span>
                      )}

                      {!isUser && (
                        <button
                          onClick={() => handleSpeak(msg)}
                          title="Listen with voice"
                          className={`p-1 rounded-full transition ${
                            isSpeaking
                              ? 'text-fuchsia-300 animate-pulse bg-purple-800/50'
                              : 'text-purple-400 hover:text-purple-200'
                          }`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        title="Copy text"
                        className="p-1 rounded-full text-purple-400 hover:text-purple-200 transition"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-end space-x-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-fuchsia-400/60">
              <img
                src="/assets/aistudio/file_00000000678c8211a89567d88285d7c0_e9d7e78e.png"
                alt="Riya"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="glass-panel rounded-2xl rounded-bl-none px-4 py-2.5 flex items-center space-x-2 border border-purple-500/30">
              <span className="text-xs text-purple-300 font-medium">Riya is thinking...</span>
              <div className="flex space-x-1">
                <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="fixed bottom-[68px] left-0 right-0 max-w-lg mx-auto px-3 z-30 pointer-events-auto">
        <div className="glass-panel rounded-full p-1.5 pl-4 pr-2 flex items-center space-x-2 shadow-2xl border border-purple-500/30">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message or command..."
            disabled={isLoading}
            className="flex-1 bg-transparent text-white placeholder-purple-400/60 text-sm focus:outline-none"
          />

          <button
            onClick={onVoiceClick}
            title="Voice input"
            className="w-9 h-9 rounded-full bg-[#3d1f5e] hover:bg-[#522580] flex items-center justify-center text-purple-200 transition shadow-inner active:scale-95"
          >
            <Mic className="w-4 h-4" />
          </button>

          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            title="Send"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition shadow-lg ${
              inputText.trim() && !isLoading
                ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-purple-600/40 active:scale-95'
                : 'bg-purple-900/40 text-purple-400/50 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
