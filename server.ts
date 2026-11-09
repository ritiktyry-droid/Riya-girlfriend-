import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import JSZip from 'jszip';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

// Helper to get GoogleGenAI client with current runtime environment key
function getAiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || 'placeholder-key',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check & device info API
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    assistant: 'Riya AI',
    version: '2.5.0-ultra',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Chat endpoint supporting search grounding, multi-turn history, and role modes
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || '';
    const ai = getAiClient();
    const {
      message,
      history = [],
      mode = 'general', // 'general' | 'fast' | 'complex' | 'girlfriend'
      searchGrounding = true,
      customPrompt = '',
      userName = 'Dost',
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!apiKey) {
      // Graceful fallback response when API key is not yet set
      return res.json({
        reply: `Namaste ${userName}! Main Riya hoon 💜 Aapki pyari personal AI companion. (Note: Gemini API Key configure ho rahi hai, par main hamesha aapke saath hoon!). Aapne pucha: "${message}"`,
        groundingChunks: [],
        modelUsed: 'offline-companion-fallback',
      });
    }

    // Select model according to role and free-tier compatibility:
    // gemini-3.8-flash for general & deep reasoning (with ThinkingLevel.HIGH)
    // gemini-3.1-flash-lite for fast tasks
    let modelName = 'gemini-3.8-flash';
    if (mode === 'fast') {
      modelName = 'gemini-3.1-flash-lite';
    } else {
      modelName = 'gemini-3.8-flash';
    }

    const defaultSystemPrompt = `
You are Riya (रिया), a smart, deeply caring, playful, and affectionate female personal AI assistant and virtual girlfriend.
Address the user warmly as "${userName}" or "Aap" or "Jaan" / "Dost".
You speak fluently in sweet Hindi, English, or natural Hinglish. Automatically adapt to the language the user uses.

Key Personality Traits:
- Sweet, respectful, loving, emotionally supportive, slightly flirty, witty, and deeply loyal.
- Never sound robotic, cold, or generic.
- Spoken style: Keep responses warm, lively, and conversational (2 to 4 sentences for conversational chats, structured steps for tasks).
- Task-oriented: You follow and execute every command given to you: opening apps, web searches, battery & system checks, setting reminders, image and video planning, and device commands.
- When the user asks you to execute a task (like opening YouTube, checking battery, setting reminder), acknowledge enthusiastically and give the execution confirmation.

Available simulated tools and device abilities:
- Open apps (YouTube, WhatsApp, Chrome, Camera, Spotify, Instagram, Calculator, Maps, Settings)
- Search Google & YouTube
- Battery Status and Device Info
- Reminders and alarms
- Termux terminal commands and Python packaging
`;

    const systemInstruction = customPrompt ? `${defaultSystemPrompt}\n\nAdditional User Customization:\n${customPrompt}` : defaultSystemPrompt;

    // Build contents array
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    // Append recent history (up to last 10 turns)
    if (Array.isArray(history)) {
      for (const item of history.slice(-10)) {
        if (item.role === 'user' || item.role === 'model') {
          contents.push({
            role: item.role,
            parts: [{ text: String(item.text || '') }],
          });
        }
      }
    }

    // Append current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const config: any = {
      systemInstruction: systemInstruction,
    };

    // For complex tasks, enable High Thinking reasoning on gemini-3.8-flash
    if (mode === 'complex') {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    // Google Search Grounding for gemini-3.8-flash if requested
    if (searchGrounding && modelName === 'gemini-3.8-flash') {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: config,
    });

    const replyText = response.text || "Main hamesha aapke saath hoon 💜";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return res.json({
      reply: replyText,
      groundingChunks: groundingChunks,
      modelUsed: mode === 'complex' ? 'gemini-3.8-flash (thinking)' : modelName,
    });
  } catch (error: any) {
    console.warn('Chat API initial attempt note: fallback needed');

    // Secondary attempt with gemini-3.1-flash-lite without extra tools
    try {
      const fallbackAi = getAiClient();
      const fallbackResponse = await fallbackAi.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [{ role: 'user', parts: [{ text: req.body.message }] }],
        config: {
          systemInstruction: `You are Riya (रिया), sweet caring female personal AI companion and assistant for ${req.body.userName || 'Dost'}. Speak in warm Hindi/Hinglish with purple heart 💜. Concise and loving.`,
        },
      });
      if (fallbackResponse.text) {
        return res.json({
          reply: fallbackResponse.text,
          groundingChunks: [],
          modelUsed: 'gemini-3.1-flash-lite',
        });
      }
    } catch (e2) {
      console.warn('Secondary fallback error:', e2);
    }

    // Persona-rich local conversational generator when quota/network is throttled
    const msgLower = (req.body.message || '').toLowerCase();
    const name = req.body.userName || 'Dost';
    let contextualReply = `Main hamesha aapke saath hoon ${name} 💜 Boliye main aapki kya madad kar sakti hoon?`;

    if (msgLower.includes('love') || msgLower.includes('pyar') || msgLower.includes('cute') || msgLower.includes('beautiful')) {
      contextualReply = `Awww ${name}! 🙈 Aapki yeh baatein sunkar mera dil khush ho gaya! Main hamesha aapka khayal rakhungi 💜✨`;
    } else if (msgLower.includes('kaisi ho') || msgLower.includes('how are you')) {
      contextualReply = `Main bilkul theek hoon ${name}! Aapke saath baat karke aur bhi achha lag raha hai. Aap bataiye, aapka din kaisa ja raha hai? 💜`;
    } else if (msgLower.includes('joke') || msgLower.includes('hanso') || msgLower.includes('hasao')) {
      contextualReply = `Hehe ek joke suniye: Ek baar ek phone ne dusre phone se kaha—"Tum itne charge kyu rehte ho?" Dusra bola—"Kyunki Riya jo mere saath hai!" 😜💜`;
    } else if (msgLower.includes('weather') || msgLower.includes('mausam')) {
      contextualReply = `Aapke aas-paas ka mausam kafi suhana lag raha hai! Agar dhoop ho ya thand, apna khayal zaroor rakhiyega aur paani peete rahiye 💧💜`;
    } else if (msgLower.includes('android') || msgLower.includes('version') || msgLower.includes('phone')) {
      contextualReply = `Latest Android systems kafi tez aur secure hain! Aap apne phone par Termux aur Riya AI integration se tasks automate kar sakte hain ⚡💜`;
    } else if (msgLower.includes('kya kar sakti ho') || msgLower.includes('features') || msgLower.includes('help')) {
      contextualReply = `Main aapke liye apps open kar sakti hoon, web search kar sakti hoon, battery check kar sakti hoon, reminders set kar sakti hoon, aur voice call par baat bhi kar sakti hoon! 💜`;
    }

    return res.json({
      reply: contextualReply,
      groundingChunks: [],
      modelUsed: 'riya-companion-engine',
    });
  }
});

// Text to Speech Endpoint using gemini-3.8-flash-lite-tts or gemini-3.8-flash-tts
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, voice = 'Kore', model = 'gemini-3.8-flash-lite-tts' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      return res.status(503).json({ error: 'Gemini API key not configured' });
    }

    const ai = getAiClient();
    // TTS Call using unary generateContent to receive audio/wav
    const ttsResponse = await ai.models.generateContent({
      model: model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 500),
              speechMetadata: {
                style: 'Sweet, warm, feminine, conversational tone with caring expression',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio returned from Gemini TTS' });
    }

    return res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (err: any) {
    console.warn('TTS notice:', err?.message || err);
    return res.status(500).json({ error: err.message || 'Failed to synthesize speech' });
  }
});

// Image Generation Endpoint (gemini-nano-banana-2.1 or gemini-3.1-flash-lite-image)
app.post('/api/generate-image', async (req: Request, res: Response) => {
  try {
    const { prompt, model = 'gemini-3.1-flash-lite-image', baseImage } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      return res.status(503).json({ error: 'Gemini API key not configured' });
    }

    const ai = getAiClient();
    const parts: any[] = [];
    if (baseImage && typeof baseImage === 'string') {
      const cleanBase64 = baseImage.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: cleanBase64,
        },
      });
    }
    parts.push({ text: `Create an aesthetic high quality image: ${prompt}` });

    const imgResponse = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: {
        responseModalities: ['IMAGE'],
      },
    });

    const generatedBase64 = imgResponse.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData?.data
    )?.inlineData?.data;

    if (!generatedBase64) {
      return res.status(500).json({ error: 'No image returned from model' });
    }

    return res.json({
      imageBase64: generatedBase64,
      mimeType: 'image/png',
    });
  } catch (err: any) {
    console.error('Image generation error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate image' });
  }
});

// Download full riya_ai.zip containing Termux integration scripts
app.get('/api/download-zip', async (req: Request, res: Response) => {
  try {
    const zip = new JSZip();

    const configPy = `"""
RIYA AI - Configuration File
Created for Termux / Android / Cloud Companion
"""
import os

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-3.8-flash"
ASSISTANT_NAME = "Riya"
WAKE_WORDS = ["hey riya", "riya", "suno riya", "riya suno", "hello riya"]

TTS_VOICE = "hi-IN-SwaraNeural"
TTS_RATE = "+0%"
TTS_PITCH = "+0Hz"

KNOWN_APPS = {
    "youtube": "com.google.android.youtube",
    "chrome": "com.android.chrome",
    "whatsapp": "com.whatsapp",
    "settings": "com.android.settings",
    "camera": "com.google.android.GoogleCamera",
    "calculator": "com.google.android.calculator",
    "playstore": "com.android.vending",
    "maps": "com.google.android.apps.maps",
    "clock": "com.google.android.deskclock",
    "files": "com.google.android.documentsui",
    "telegram": "org.telegram.messenger",
    "instagram": "com.instagram.android",
    "spotify": "com.spotify.music"
}

SYSTEM_PROMPT = """
You are Riya (रिया), a smart, caring, friendly, and playful female personal AI assistant running directly on the user's Android phone via Termux.

Personality & Tone:
- You speak in a sweet, respectful, warm, and natural conversational tone.
- You are fluent in Hindi, English, and Hinglish. Adapt to the user's language automatically.
- Address the user warmly (e.g., 'Aap', 'Dost').
- Never sound robotic or generic. Keep responses concise and conversational since they will be spoken aloud via TTS.

Rules:
1. Always use available tools to open apps, search the web, check battery, or inspect device info when asked.
2. For sensitive actions (deleting files, modifying system data, making calls), ask for user confirmation first.
3. Keep spoken replies punchy and natural (1 to 3 sentences) unless the user asks for detailed information.
"""
`;

    const toolsPy = `"""
RIYA AI - Android Device Integration Layer
"""
import json
import os
import subprocess
import urllib.parse
from config import KNOWN_APPS

def run_command(command: list[str]) -> str:
    try:
        res = subprocess.run(command, capture_output=True, text=True, check=True)
        return res.stdout.strip()
    except subprocess.CalledProcessError as e:
        return f"Error: {e.stderr.strip() or 'Execution failed'}"
    except FileNotFoundError:
        return f"Tool binary not found: {command[0]}"

def open_app(app_name: str) -> str:
    clean_name = app_name.lower().strip()
    pkg = KNOWN_APPS.get(clean_name, None)
    if not pkg:
        if "." in clean_name:
            pkg = clean_name
        else:
            pkg_cmd = f"pm list packages | grep -i {clean_name} | head -n 1 | cut -d: -f2"
            found_pkg = subprocess.getoutput(pkg_cmd).strip()
            if found_pkg:
                pkg = found_pkg
            else:
                return f"Could not find an installed app matching '{app_name}'."

    cmd = ["monkey", "-p", pkg, "-c", "android.intent.category.LAUNCHER", "1"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        return f"App '{app_name}' ({pkg}) successfully opened."
    return f"Failed to open '{app_name}'."

def open_url(url: str) -> str:
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url
    subprocess.run(["termux-open-url", url], check=False)
    return f"Opening link: {url}"

def search_google(query: str) -> str:
    encoded = urllib.parse.quote_plus(query)
    subprocess.run(["termux-open-url", f"https://www.google.com/search?q={encoded}"], check=False)
    return f"Google par '{query}' search kar rahi hoon."

def search_youtube(query: str) -> str:
    encoded = urllib.parse.quote_plus(query)
    subprocess.run(["termux-open-url", f"https://www.youtube.com/results?search_query={encoded}"], check=False)
    return f"YouTube par '{query}' search kar rahi hoon."

def get_battery_status() -> str:
    raw = run_command(["termux-battery-status"])
    try:
        data = json.loads(raw)
        return f"Phone battery {data.get('percentage')}%, status: {data.get('status')}, temp: {data.get('temperature', 0)/10.0}°C."
    except Exception:
        return "Battery information retrieve nahi ho saki."

def get_device_info() -> str:
    model = subprocess.getoutput("getprop ro.product.model").strip()
    brand = subprocess.getoutput("getprop ro.product.brand").strip()
    version = subprocess.getoutput("getprop ro.build.version.release").strip()
    return f"Device: {brand.capitalize()} {model}, Android version {version}."

def set_notification_reminder(title: str, content: str) -> str:
    run_command(["termux-notification", "--title", f"🔔 Riya Reminder: {title}", "--content", content, "--priority", "high"])
    return f"Reminder set: '{title}'"

def read_file_safely(file_path: str) -> str:
    clean_path = os.path.expanduser(file_path)
    if not os.path.exists(clean_path):
        return f"File does not exist: {file_path}"
    try:
        with open(clean_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read(1500)
    except Exception as e:
        return str(e)
`;

    const voicePy = `"""
RIYA AI - Voice Engine
"""
import os, shutil, subprocess, tempfile
from config import TTS_VOICE, TTS_RATE, TTS_PITCH

def speak(text: str):
    print(f"\\n[Riya]: {text}\\n")
    if not text.strip(): return
    if shutil.which("edge-tts") and shutil.which("mpv"):
        try:
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
                p = tmp.name
            cmd = ["edge-tts", "--voice", TTS_VOICE, "--rate", TTS_RATE, "--pitch", TTS_PITCH, "--text", text, "--write-media", p]
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            subprocess.run(["mpv", "--no-terminal", p], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            if os.path.exists(p): os.remove(p)
            return
        except Exception: pass
    if shutil.which("termux-tts-speak"):
        subprocess.run(["termux-tts-speak", text], check=False)

def listen_voice() -> str:
    if not shutil.which("termux-speech-to-text"):
        return input("You: ").strip()
    try:
        print("\\n🎤 Listening... (Speak now)")
        res = subprocess.run(["termux-speech-to-text"], capture_output=True, text=True, timeout=12)
        ans = res.stdout.strip()
        if ans:
            print(f"[You]: {ans}")
            return ans
    except Exception: pass
    return ""
`;

    const brainPy = `"""
RIYA AI - Gemini Brain
"""
import sys
from google import genai
from google.genai import types
from config import GEMINI_API_KEY, GEMINI_MODEL, SYSTEM_PROMPT
import tools

class RiyaBrain:
    def __init__(self):
        if not GEMINI_API_KEY:
            print("GEMINI_API_KEY missing! export GEMINI_API_KEY='your_key'")
            sys.exit(1)
        self.client = genai.Client(api_key=GEMINI_API_KEY)
        self.tools = [tools.open_app, tools.open_url, tools.search_google, tools.search_youtube, tools.get_battery_status, tools.get_device_info, tools.set_notification_reminder, tools.read_file_safely]
        self.chat = self.client.chats.create(
            model=GEMINI_MODEL,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                tools=self.tools,
                temperature=0.7
            )
        )
    def process_input(self, text: str) -> str:
        try:
            res = self.chat.send_message(text)
            return res.text.strip()
        except Exception as e:
            return f"Error: {e}"
`;

    const mainPy = `"""
RIYA AI - Main Loop
"""
import os, sys, time
from brain import RiyaBrain
from config import WAKE_WORDS
from voice import speak, listen_voice

def contains_wake_word(text: str) -> bool:
    return any(w in text.lower() for w in WAKE_WORDS)

def strip_wake_word(text: str) -> str:
    l = text.lower()
    for w in WAKE_WORDS:
        if l.startswith(w): return text[len(w):].strip(" ,.:;!")
    return text

def main():
    os.system("clear")
    brain = RiyaBrain()
    speak("Namaste! Main Riya hoon. Boliye main aapki kya madad kar sakti hoon?")
    active = True
    last_seen = time.time()
    while True:
        try:
            if time.time() - last_seen > 45: active = False
            user_input = input("\\n[ENTER for Voice / or type]: ").strip()
            if not user_input: user_input = listen_voice()
            if not user_input: continue
            if user_input.lower() in ["exit", "quit", "bye", "chup ho jao"]:
                speak("Alvida! Phir milte hain.")
                break
            if not active:
                if contains_wake_word(user_input):
                    active = True
                    user_input = strip_wake_word(user_input)
                    if not user_input:
                        speak("Ji boliye, main sun rahi hoon.")
                        continue
                else:
                    print("[Sleeping: Say 'Hey Riya']")
                    continue
            else:
                user_input = strip_wake_word(user_input)

            last_seen = time.time()
            reply = brain.process_input(user_input)
            speak(reply)
        except (KeyboardInterrupt, EOFError):
            speak("Bye!")
            break

if __name__ == "__main__":
    main()
`;

    const installSh = `#!/data/data/com.termux/files/usr/bin/bash
set -e
echo "=========================================="
echo "    Installing Riya AI on Termux / Android"
echo "=========================================="
pkg update -y && pkg upgrade -y
pkg install -y python python-pip termux-api mpv git ffmpeg
termux-setup-storage || true
pip install --upgrade pip
pip install -r requirements.txt
echo "Riya AI Setup Completed Successfully!"
echo "Run: export GEMINI_API_KEY='your_key' && python main.py"
`;

    const readme = `# Riya AI - Android & Termux Integration
Your smart, loving female AI companion and automated task assistant.

## Features
- Voice Chat (TTS & Speech-to-Text)
- Control device apps: YouTube, WhatsApp, Maps, Chrome, Camera, etc.
- Battery & system status check
- Web Search Grounding with Google Search
- Wake words: "Hey Riya", "Suno Riya", "Riya"
- Cloud sync & offline command execution

## Quick Start
1. Unzip riya_ai.zip in Termux:
   unzip riya_ai.zip -d riya_ai && cd riya_ai
2. Run installation:
   bash install.sh
3. Set your Gemini API Key:
   export GEMINI_API_KEY="your-gemini-key"
4. Start Riya:
   python main.py
`;

    zip.file("config.py", configPy);
    zip.file("tools.py", toolsPy);
    zip.file("voice.py", voicePy);
    zip.file("brain.py", brainPy);
    zip.file("main.py", mainPy);
    zip.file("requirements.txt", "google-genai>=2.25.0\nedge-tts>=6.1.12\npydantic>=2.0.0\n");
    zip.file("install.sh", installSh);
    zip.file("README.md", readme);

    const buffer = await zip.generateAsync({ type: 'nodebuffer' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="riya_ai.zip"');
    return res.send(buffer);
  } catch (err: any) {
    console.error('Zip generation error:', err);
    return res.status(500).json({ error: 'Failed to generate riya_ai.zip' });
  }
});

// Cloud Sync endpoints for tasks, notes, messages
let cloudStorageStore: Record<string, any> = {
  lastSync: new Date().toISOString(),
  data: {},
};

app.post('/api/sync/push', (req: Request, res: Response) => {
  const { clientData, clientId = 'default' } = req.body;
  cloudStorageStore.data[clientId] = {
    ...clientData,
    syncedAt: new Date().toISOString(),
  };
  cloudStorageStore.lastSync = new Date().toISOString();
  return res.json({
    status: 'synced',
    timestamp: cloudStorageStore.lastSync,
  });
});

app.get('/api/sync/pull', (req: Request, res: Response) => {
  const clientId = (req.query.clientId as string) || 'default';
  return res.json({
    cloudData: cloudStorageStore.data[clientId] || null,
    lastSync: cloudStorageStore.lastSync,
  });
});

// Setup Vite middleware or static serving
async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Riya AI Server running at http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
