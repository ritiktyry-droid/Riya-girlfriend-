import React, { useState, useEffect } from 'react';
import {
  Play,
  Battery,
  Terminal,
  Download,
  Copy,
  Check,
  Bell,
  Plus,
  ExternalLink,
  Smartphone,
  Cpu,
  RefreshCw,
  FolderArchive,
  Code2,
} from 'lucide-react';
import { TaskItem, ReminderItem } from '../types';
import { KNOWN_APPS_MAP, parseAndExecuteCommand } from '../services/commandRunner';
import { getRealBatteryInfo } from '../services/api';
import confetti from 'canvas-confetti';

interface TasksTabProps {
  tasks: TaskItem[];
  onAddTask: (task: TaskItem) => void;
  reminders: ReminderItem[];
  onAddReminder: (reminder: ReminderItem) => void;
  onToggleReminder: (id: string) => void;
  onExecuteCommand: (cmd: string) => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  tasks,
  onAddTask,
  reminders,
  onAddReminder,
  onToggleReminder,
  onExecuteCommand,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'apps' | 'device' | 'termux' | 'reminders'>('apps');
  const [batteryData, setBatteryData] = useState<{ level: number; charging: boolean; status: string }>({
    level: 100,
    charging: true,
    status: 'Optimal ⚡',
  });
  const [copiedCode, setCopiedCode] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('Today, 7:00 PM');
  const [activeCodeFile, setActiveCodeFile] = useState<'config.py' | 'tools.py' | 'brain.py' | 'install.sh'>('config.py');

  useEffect(() => {
    getRealBatteryInfo().then((info) => {
      if (info) {
        setBatteryData({
          level: info.level,
          charging: info.charging,
          status: info.charging ? 'Charging ⚡' : 'Normal Discharging',
        });
      }
    });
  }, []);

  const handleLaunchApp = async (key: string) => {
    const app = KNOWN_APPS_MAP[key];
    if (!app) return;

    const res = await parseAndExecuteCommand(`open ${key}`);
    if (res.task) {
      onAddTask(res.task);
    }

    if (app.webUrl) {
      window.open(app.webUrl, '_blank', 'noopener,noreferrer');
    }

    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#a855f7', '#ec4899', '#8b5cf6'],
    });
  };

  const handleDownloadZip = () => {
    setIsDownloadingZip(true);
    const link = document.createElement('a');
    link.href = '/api/download-zip';
    link.download = 'riya_ai.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });

    const task: TaskItem = {
      id: `task-${Date.now()}`,
      title: 'Downloaded riya_ai.zip Package',
      type: 'termux',
      description: 'Downloaded full Python Termux source package for Android',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      completed: true,
    };
    onAddTask(task);

    setTimeout(() => setIsDownloadingZip(false), 1500);
  };

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim()) return;

    const reminder: ReminderItem = {
      id: `rem-${Date.now()}`,
      title: newReminderTitle.trim(),
      time: newReminderTime,
      completed: false,
    };
    onAddReminder(reminder);
    setNewReminderTitle('');

    // Trigger browser notification permission if available
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const termuxInstallOneLiner = `pkg update -y && pkg install -y python python-pip termux-api mpv git && unzip riya_ai.zip -d riya_ai && cd riya_ai && pip install -r requirements.txt && python main.py`;

  const copyTermuxCommand = () => {
    navigator.clipboard.writeText(termuxInstallOneLiner);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const codeSnippets = {
    'config.py': `ASSISTANT_NAME = "Riya"
GEMINI_MODEL = "gemini-3.8-flash"
WAKE_WORDS = ["hey riya", "riya", "suno riya", "hello riya"]
TTS_VOICE = "hi-IN-SwaraNeural"

KNOWN_APPS = {
    "youtube": "com.google.android.youtube",
    "whatsapp": "com.whatsapp",
    "chrome": "com.android.chrome",
    "spotify": "com.spotify.music"
}`,
    'tools.py': `def open_app(app_name: str) -> str:
    pkg = KNOWN_APPS.get(app_name.lower())
    cmd = ["monkey", "-p", pkg, "-c", "android.intent.category.LAUNCHER", "1"]
    subprocess.run(cmd, check=True)
    return f"App {app_name} opened."

def get_battery_status() -> str:
    raw = subprocess.check_output(["termux-battery-status"])
    return json.loads(raw)`,
    'brain.py': `class RiyaBrain:
    def __init__(self):
        self.client = genai.Client(api_key=GEMINI_API_KEY)
        self.chat = self.client.chats.create(
            model="gemini-3.8-flash",
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                tools=[tools.open_app, tools.get_battery_status]
            )
        )`,
    'install.sh': `#!/data/data/com.termux/files/usr/bin/bash
set -e
pkg update -y
pkg install -y python python-pip termux-api mpv git ffmpeg
pip install -r requirements.txt
echo "Riya AI Setup Completed Successfully!"`,
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] pb-24 px-2 space-y-4 select-none">
      {/* Category Pills Header */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar pt-1">
        <button
          onClick={() => setSelectedCategory('apps')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap flex items-center space-x-1.5 ${
            selectedCategory === 'apps'
              ? 'bg-purple-600 text-white shadow-[0_0_12px_#a855f7]'
              : 'bg-purple-950/60 text-purple-300 hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Launch Apps</span>
        </button>

        <button
          onClick={() => setSelectedCategory('device')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap flex items-center space-x-1.5 ${
            selectedCategory === 'device'
              ? 'bg-fuchsia-600 text-white shadow-[0_0_12px_#d946ef]'
              : 'bg-purple-950/60 text-purple-300 hover:text-white'
          }`}
        >
          <Battery className="w-3.5 h-3.5" />
          <span>Battery & System</span>
        </button>

        <button
          onClick={() => setSelectedCategory('termux')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap flex items-center space-x-1.5 ${
            selectedCategory === 'termux'
              ? 'bg-indigo-600 text-white shadow-[0_0_12px_#6366f1]'
              : 'bg-purple-950/60 text-purple-300 hover:text-white'
          }`}
        >
          <FolderArchive className="w-3.5 h-3.5" />
          <span>Termux riya_ai.zip</span>
        </button>

        <button
          onClick={() => setSelectedCategory('reminders')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap flex items-center space-x-1.5 ${
            selectedCategory === 'reminders'
              ? 'bg-pink-600 text-white shadow-[0_0_12px_#ec4899]'
              : 'bg-purple-950/60 text-purple-300 hover:text-white'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Reminders</span>
        </button>
      </div>

      {/* 1. App Launch Grid */}
      {selectedCategory === 'apps' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-purple-300 px-1">
            <span className="font-semibold">Tap to execute command & launch:</span>
            <span className="text-[11px] text-purple-400">Android & Web Intent</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {Object.entries(KNOWN_APPS_MAP).map(([key, app]) => (
              <button
                key={key}
                onClick={() => handleLaunchApp(key)}
                className="glass-card rounded-2xl p-3 flex flex-col items-center justify-center space-y-2 hover:border-purple-400/60 transition active:scale-95 group shadow-sm text-center"
              >
                <span className="text-2xl group-hover:scale-115 transition">{app.icon}</span>
                <span className="text-xs font-semibold text-white group-hover:text-purple-200 truncate w-full">
                  {app.label}
                </span>
                <span className="text-[10px] text-purple-400/80 font-mono truncate w-full">
                  {app.pkg.split('.').pop()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Device & Battery Diagnostic */}
      {selectedCategory === 'device' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-4 border border-purple-500/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Battery className="w-6 h-6 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Battery Telemetry</h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                {batteryData.status}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-purple-200">
                <span>Current Charge</span>
                <span className="font-bold text-white">{batteryData.level}%</span>
              </div>
              <div className="w-full bg-purple-950/80 h-3 rounded-full overflow-hidden p-0.5 border border-purple-700/30">
                <div
                  style={{ width: `${batteryData.level}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_#10b981]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-purple-800/30 text-xs">
              <div>
                <span className="text-purple-400 block text-[11px]">Temperature</span>
                <span className="text-purple-100 font-semibold">32.4°C (Normal)</span>
              </div>
              <div>
                <span className="text-purple-400 block text-[11px]">Health</span>
                <span className="text-emerald-300 font-semibold">Good (Li-ion)</span>
              </div>
            </div>

            <button
              onClick={() => onExecuteCommand('check battery status')}
              className="mt-4 w-full py-2 rounded-xl bg-purple-700/60 hover:bg-purple-600/80 border border-purple-400/30 text-xs font-semibold text-white transition flex items-center justify-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Ask Riya to Speak Battery Status 🔊</span>
            </button>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-purple-500/20 text-xs space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Host System Specifications</span>
            </h4>
            <div className="space-y-1 font-mono text-[11px] text-purple-300/80 bg-black/40 p-2.5 rounded-xl border border-purple-900/40">
              <div>DEVICE_BRAND : Android / Linux</div>
              <div>KERNEL_ARCH   : arm64-v8a / x86_64</div>
              <div>ENV_SHELL     : Termux BASH</div>
              <div>AI_ENGINE     : Gemini 3.8 Flash + Live Voice</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Termux riya_ai.zip Hub */}
      {selectedCategory === 'termux' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-4 border border-purple-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FolderArchive className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Package: riya_ai.zip</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-mono">
                Ready to Run
              </span>
            </div>

            <p className="text-xs text-purple-200/80 leading-relaxed">
              Contains all Python and Bash files for running Riya directly inside Termux on Android with background wake words and speech.
            </p>

            <button
              onClick={handleDownloadZip}
              disabled={isDownloadingZip}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white font-bold text-xs shadow-lg shadow-purple-900/40 flex items-center justify-center space-x-2 transition active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloadingZip ? 'Packaging Zip...' : 'Download riya_ai.zip Now'}</span>
            </button>
          </div>

          {/* Quick 1-Liner Termux Command */}
          <div className="glass-panel rounded-2xl p-3 border border-purple-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-purple-200 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>Termux 1-Liner Setup Command:</span>
              </span>
              <button
                onClick={copyTermuxCommand}
                className="flex items-center space-x-1 text-fuchsia-300 hover:text-white transition text-[11px]"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <pre className="bg-black/50 p-2.5 rounded-xl font-mono text-[10px] text-purple-300 overflow-x-auto border border-purple-900/40">
              {termuxInstallOneLiner}
            </pre>
          </div>

          {/* Script Inspector */}
          <div className="glass-panel rounded-2xl p-3 border border-purple-500/20 space-y-2">
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-xs">
              {(['config.py', 'tools.py', 'brain.py', 'install.sh'] as const).map((file) => (
                <button
                  key={file}
                  onClick={() => setActiveCodeFile(file)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition ${
                    activeCodeFile === file
                      ? 'bg-purple-700 text-white font-bold'
                      : 'bg-purple-950/40 text-purple-400 hover:text-white'
                  }`}
                >
                  {file}
                </button>
              ))}
            </div>
            <pre className="bg-black/60 p-3 rounded-xl font-mono text-[10px] text-fuchsia-200/90 overflow-x-auto max-h-48 border border-purple-900/40">
              {codeSnippets[activeCodeFile]}
            </pre>
          </div>
        </div>
      )}

      {/* 4. Reminders Manager */}
      {selectedCategory === 'reminders' && (
        <div className="space-y-4">
          {/* Create Reminder Form */}
          <form onSubmit={handleCreateReminder} className="glass-card rounded-2xl p-3.5 space-y-2.5 border border-purple-500/30">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-fuchsia-400" />
              <span>Set New Reminder with Riya</span>
            </h4>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="What should Riya remind you about?"
                value={newReminderTitle}
                onChange={(e) => setNewReminderTitle(e.target.value)}
                className="w-full bg-purple-950/60 border border-purple-700/40 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
              />
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Time (e.g., In 30 mins, 8:00 PM)"
                  value={newReminderTime}
                  onChange={(e) => setNewReminderTime(e.target.value)}
                  className="flex-1 bg-purple-950/60 border border-purple-700/40 rounded-xl px-3 py-1.5 text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
                />
                <button
                  type="submit"
                  disabled={!newReminderTitle.trim()}
                  className="px-4 py-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-semibold rounded-xl text-xs transition shadow-md disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </form>

          {/* Reminders List */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-purple-300 px-1">Your Active Reminders:</span>
            {reminders.map((rem) => (
              <div
                key={rem.id}
                onClick={() => onToggleReminder(rem.id)}
                className={`glass-panel rounded-xl p-3 border transition flex items-center justify-between cursor-pointer ${
                  rem.completed
                    ? 'border-purple-900/30 opacity-60 bg-purple-950/30'
                    : 'border-purple-500/30 hover:border-fuchsia-400/50'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      rem.completed
                        ? 'bg-emerald-500 border-emerald-400 text-black'
                        : 'border-purple-400'
                    }`}
                  >
                    {rem.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div>
                    <div
                      className={`text-xs font-semibold ${
                        rem.completed ? 'line-through text-purple-400' : 'text-white'
                      }`}
                    >
                      {rem.title}
                    </div>
                    <div className="text-[10px] text-purple-400">{rem.time}</div>
                  </div>
                </div>
                <Bell className="w-3.5 h-3.5 text-purple-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Executed Tasks Activity Feed */}
      <div className="pt-2">
        <div className="flex items-center justify-between text-xs text-purple-300 px-1 mb-2">
          <span className="font-semibold">Recent Command History:</span>
          <span className="text-[10px] text-purple-400">{tasks.length} executed</span>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {tasks.slice(0, 5).map((t) => (
            <div
              key={t.id}
              className="glass-panel rounded-xl p-2.5 border border-purple-500/20 flex items-center justify-between text-xs"
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                <div>
                  <div className="font-medium text-white">{t.title}</div>
                  <div className="text-[10px] text-purple-400/80 truncate max-w-[200px]">
                    {t.description}
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-purple-400 font-mono">{t.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
