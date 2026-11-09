import { ChatMessage, GroundingChunk } from '../types';

export interface ChatResponse {
  reply: string;
  groundingChunks?: GroundingChunk[];
  modelUsed?: string;
  error?: string;
}

export async function sendChatMessage(params: {
  message: string;
  history: ChatMessage[];
  mode?: 'general' | 'fast' | 'complex';
  searchGrounding?: boolean;
  customPrompt?: string;
  userName?: string;
}): Promise<ChatResponse> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        reply: errData.fallbackReply || "Main yahan hoon dost! Thoda sa server delay hai, par main aapki har baat sun rahi hoon 💜",
        error: errData.error || 'Server error',
      };
    }

    return await res.json();
  } catch (err: any) {
    console.error('Chat API request failed:', err);
    // Offline companion response
    return {
      reply: `[Offline Mode] Main aapki baat sun rahi hoon! Internet connectivity restore hote hi main live search aur full response sync kar dungi 💜`,
      error: 'Network unavailable',
      modelUsed: 'offline-local-cache',
    };
  }
}

export async function requestTts(text: string, voice = 'Kore'): Promise<string | null> {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.audioBase64 ? `data:audio/wav;base64,${data.audioBase64}` : null;
  } catch (err) {
    console.warn('TTS API error, falling back to browser speech synthesis:', err);
    return null;
  }
}

export async function requestImageGeneration(prompt: string, baseImage?: string): Promise<string | null> {
  try {
    const res = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, baseImage }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.imageBase64 ? `data:image/png;base64,${data.imageBase64}` : null;
  } catch (err) {
    console.error('Image gen error:', err);
    return null;
  }
}

export async function pushSync(clientData: any): Promise<boolean> {
  try {
    const res = await fetch('/api/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientData }),
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function pullSync(): Promise<any | null> {
  try {
    const res = await fetch('/api/sync/pull');
    if (!res.ok) return null;
    const data = await res.json();
    return data.cloudData;
  } catch (err) {
    return null;
  }
}

// Play speech using Gemini TTS, or browser SpeechSynthesis fallback
export function speakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  preferredVoice?: string
): void {
  // Try Gemini TTS first
  requestTts(text, preferredVoice || 'Kore').then((audioUrl) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      if (onStart) audio.onplay = onStart;
      if (onEnd) audio.onended = onEnd;
      audio.onerror = () => fallbackBrowserSpeech(text, onStart, onEnd);
      audio.play().catch(() => fallbackBrowserSpeech(text, onStart, onEnd));
    } else {
      fallbackBrowserSpeech(text, onStart, onEnd);
    }
  });
}

function fallbackBrowserSpeech(text: string, onStart?: () => void, onEnd?: () => void) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`~💜✨🎵🌸]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.15; // slightly higher feminine pitch
    
    // Pick an Indian English or Hindi female voice if available
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(
      (v) =>
        v.lang.includes('hi') ||
        v.name.toLowerCase().includes('swara') ||
        v.name.toLowerCase().includes('kalpana') ||
        v.name.toLowerCase().includes('india')
    ) || voices.find((v) => v.lang.includes('en') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira')));

    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;
    utterance.onerror = () => onEnd?.();

    window.speechSynthesis.speak(utterance);
  } else {
    onEnd?.();
  }
}

// Play the special local pre-recorded audio of Riya/Arushi
export function playPreRecordedGreeting(onStart?: () => void, onEnd?: () => void): HTMLAudioElement {
  const audio = new Audio('/assets/aistudio/ElevenLabs_Text_to_Speech_audio_a91a29cc.mp3');
  if (onStart) audio.onplay = onStart;
  if (onEnd) audio.onended = onEnd;
  audio.play().catch((e) => {
    console.warn('Audio playback error (user interaction might be needed):', e);
    onEnd?.();
  });
  return audio;
}

// Real browser battery info
export async function getRealBatteryInfo(): Promise<{
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
} | null> {
  try {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      const battery: any = await (navigator as any).getBattery();
      return {
        level: Math.round(battery.level * 100),
        charging: Boolean(battery.charging),
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime,
      };
    }
  } catch (e) {
    console.warn('Battery API unavailable:', e);
  }
  return null;
}
