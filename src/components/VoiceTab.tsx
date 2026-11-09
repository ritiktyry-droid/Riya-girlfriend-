import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, PhoneCall, PhoneOff, Radio, Play, Pause } from 'lucide-react';
import { UserPreferences } from '../types';
import { speakText, playPreRecordedGreeting } from '../services/api';

interface VoiceTabProps {
  onSendMessage: (text: string) => void;
  preferences: UserPreferences;
  lastReplyText?: string;
}

export const VoiceTab: React.FC<VoiceTabProps> = ({
  onSendMessage,
  preferences,
  lastReplyText,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'speaking'>('idle');
  const [callActive, setCallActive] = useState(true);
  const [isPlayingRecordedNote, setIsPlayingRecordedNote] = useState(false);

  const recognitionRef = useRef<any>(null);
  const recordedAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize SpeechRecognition if available in browser
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN'; // hindi / hinglish preferred, fallback to en

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceStatus('listening');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const currentText = final || interim;
        setTranscript(currentText);

        if (final && final.trim().length > 1) {
          // Check wake words or send direct
          const cleaned = final.trim();
          onSendMessage(cleaned);
          setVoiceStatus('speaking');
          setTranscript(`You: "${cleaned}"`);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setVoiceStatus('idle');
      };

      recognition.onend = () => {
        setIsListening(false);
        if (voiceStatus !== 'speaking') {
          setVoiceStatus('idle');
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (recordedAudioRef.current) {
        recordedAudioRef.current.pause();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. You can type in the Chat tab!');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setVoiceStatus('idle');
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 200);
      }
    }
  };

  const handlePlayVoiceSample = () => {
    if (isPlayingRecordedNote && recordedAudioRef.current) {
      recordedAudioRef.current.pause();
      setIsPlayingRecordedNote(false);
      setVoiceStatus('idle');
      return;
    }

    setIsPlayingRecordedNote(true);
    setVoiceStatus('speaking');
    recordedAudioRef.current = playPreRecordedGreeting(
      () => {
        setIsPlayingRecordedNote(true);
        setVoiceStatus('speaking');
      },
      () => {
        setIsPlayingRecordedNote(false);
        setVoiceStatus('idle');
      }
    );
  };

  const handleSpeakCurrentReply = () => {
    const textToSpeak = lastReplyText || "Namaste dost! Main Riya hoon. Boliye main aapki kya madad kar sakti hoon?";
    setVoiceStatus('speaking');
    speakText(
      textToSpeak,
      () => setVoiceStatus('speaking'),
      () => setVoiceStatus('idle'),
      preferences.voiceVoiceName
    );
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100vh-160px)] pb-24 text-center px-4 select-none">
      {/* Top Call Info */}
      <div className="glass-panel rounded-full px-5 py-2 border border-purple-500/30 flex items-center space-x-2 mt-2">
        <Radio className="w-4 h-4 text-fuchsia-400 animate-pulse" />
        <span className="text-xs font-semibold text-purple-200">
          Live Voice Session with Riya 💜
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/80 text-fuchsia-300 font-mono">
          HD Voice
        </span>
      </div>

      {/* Center Interactive Visualizer & Glowing Avatar */}
      <div className="relative my-8 flex items-center justify-center">
        {/* Pulsing Aura Rings */}
        <div
          className={`absolute w-72 h-72 rounded-full border border-fuchsia-500/20 transition-all duration-700 ${
            voiceStatus === 'speaking' || isListening
              ? 'scale-125 bg-fuchsia-900/10 animate-ping'
              : 'scale-100'
          }`}
        />
        <div
          className={`absolute w-60 h-60 rounded-full border border-purple-500/30 transition-all duration-500 ${
            voiceStatus === 'speaking' || isListening
              ? 'scale-110 shadow-[0_0_50px_rgba(168,85,247,0.4)]'
              : 'scale-95'
          }`}
        />

        {/* Central Circular Avatar */}
        <div
          onClick={handlePlayVoiceSample}
          className="relative w-44 h-44 rounded-full p-1.5 bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-pink-500 shadow-[0_0_35px_rgba(217,70,239,0.5)] cursor-pointer group transition transform hover:scale-105 active:scale-95"
        >
          <div className="w-full h-full rounded-full overflow-hidden border-2 border-purple-900">
            <img
              src="/assets/aistudio/file_00000000678c8211a89567d88285d7c0_e9d7e78e.png"
              alt="Riya Voice Avatar"
              className="w-full h-full object-cover object-top"
            />
          </div>

          {/* Badge over avatar */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-purple-950/90 border border-fuchsia-400/50 text-[11px] font-bold text-fuchsia-200 shadow-lg whitespace-nowrap flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-fuchsia-300" />
            <span>Riya</span>
          </div>
        </div>
      </div>

      {/* Voice Status & Live Waveform */}
      <div className="w-full max-w-sm">
        <div className="text-base font-semibold text-white mb-1">
          {voiceStatus === 'speaking'
            ? 'Riya is speaking... 🎵'
            : isListening
            ? 'Listening to you... 🎤'
            : 'Tap mic or say "Hey Riya"'}
        </div>

        {/* Audio Wave Bars Simulation */}
        <div className="flex items-center justify-center space-x-1.5 h-8 my-2">
          {[40, 70, 95, 60, 85, 50, 90, 75, 45].map((h, i) => (
            <div
              key={i}
              style={{
                height:
                  voiceStatus === 'speaking' || isListening
                    ? `${(h * (Math.sin(Date.now() / 200 + i) + 1.2)) / 2}%`
                    : '12%',
              }}
              className={`w-1 rounded-full transition-all duration-150 ${
                voiceStatus === 'speaking'
                  ? 'bg-gradient-to-t from-fuchsia-600 to-pink-400'
                  : isListening
                  ? 'bg-gradient-to-t from-purple-600 to-emerald-400'
                  : 'bg-purple-850/60'
              }`}
            />
          ))}
        </div>

        {/* Transcript Box */}
        <div className="glass-panel rounded-2xl p-3 border border-purple-500/20 text-xs text-purple-200 min-h-[50px] flex items-center justify-center italic">
          {transcript || (lastReplyText ? `"${lastReplyText.slice(0, 120)}..."` : '"Tap mic to speak with Riya in Hindi or English..."')}
        </div>
      </div>

      {/* Call & Voice Control Action Bar */}
      <div className="flex items-center justify-center space-x-5 mt-6">
        {/* Sample Voice note play button */}
        <button
          onClick={handlePlayVoiceSample}
          title="Play Original Audio Note"
          className="w-12 h-12 rounded-full glass-panel border border-fuchsia-400/40 hover:bg-fuchsia-900/40 flex items-center justify-center text-fuchsia-300 transition active:scale-95 shadow-md"
        >
          {isPlayingRecordedNote ? (
            <Pause className="w-5 h-5 text-fuchsia-400" />
          ) : (
            <Play className="w-5 h-5 text-fuchsia-400 ml-0.5" />
          )}
        </button>

        {/* Main Microphone Button */}
        <button
          onClick={toggleListening}
          className={`w-18 h-18 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl active:scale-90 ${
            isListening
              ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_30px_#f43f5e] animate-pulse text-white'
              : 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-700 shadow-[0_0_25px_#a855f7] text-white hover:scale-105'
          }`}
        >
          {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
        </button>

        {/* Text to speech replay button */}
        <button
          onClick={handleSpeakCurrentReply}
          title="Speak Current Reply"
          className="w-12 h-12 rounded-full glass-panel border border-purple-500/40 hover:bg-purple-900/40 flex items-center justify-center text-purple-200 transition active:scale-95 shadow-md"
        >
          <Volume2 className="w-5 h-5 text-purple-300" />
        </button>
      </div>
    </div>
  );
};
