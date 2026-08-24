import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Download,
  Share2,
  Monitor,
  Terminal,
  Check,
  Copy,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface ConvertAppModalProps {
  onClose: () => void;
}

export const ConvertAppModal: React.FC<ConvertAppModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'pwa' | 'apk' | 'desktop'>('pwa');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const currentUrl = window.location.href;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#050507]/90 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-lg my-6 rounded-3xl bg-gradient-to-br from-[#12141d] to-[#0a0a0e] border border-[#ffffff15] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ffffff10] bg-[#0a0a0e]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] border border-indigo-400/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">
                Convert & Install as Native App
              </h2>
              <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400">
                PWA • Android APK • Desktop .exe / .dmg
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#1a1b23] border border-[#ffffff08] text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Platform Selector Tabs */}
        <div className="px-6 pt-4 pb-2 flex gap-2 border-b border-[#ffffff08] bg-[#0d0e14]">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-mono font-bold transition-all border ${
              activeTab === 'pwa'
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-[0_0_12px_rgba(79,70,229,0.3)]'
                : 'bg-[#1a1b23] text-gray-400 border-transparent hover:text-gray-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Instant PWA (iOS / Android)</span>
          </button>

          <button
            onClick={() => setActiveTab('apk')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-mono font-bold transition-all border ${
              activeTab === 'apk'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-[#1a1b23] text-gray-400 border-transparent hover:text-gray-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Capacitor APK</span>
          </button>

          <button
            onClick={() => setActiveTab('desktop')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-mono font-bold transition-all border ${
              activeTab === 'desktop'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                : 'bg-[#1a1b23] text-gray-400 border-transparent hover:text-gray-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Tauri / Electron</span>
          </button>
        </div>

        {/* Tab 1: PWA (Instant One-Tap Install) */}
        {activeTab === 'pwa' && (
          <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            {/* Quick Install Banner if browser supports beforeinstallprompt */}
            {deferredPrompt && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-600/20 to-blue-600/20 border border-indigo-500/40 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Ready for 1-Click Install
                  </h4>
                  <p className="text-[11px] text-indigo-300 font-mono">
                    Add icon to home screen with standalone app window
                  </p>
                </div>
                <button
                  onClick={handleInstallPwa}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg active:scale-95 transition-all"
                >
                  Install Now
                </button>
              </div>
            )}

            {isInstalled && (
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Running in standalone native PWA mode!</span>
              </div>
            )}

            {/* Android Steps */}
            <div className="p-4 rounded-2xl bg-[#0f1016] border border-[#ffffff08] space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold text-emerald-400 font-mono">
                  1
                </span>
                <h4 className="text-xs font-bold text-white uppercase font-mono">
                  Android (Chrome / Brave / Edge)
                </h4>
              </div>
              <ol className="text-xs text-gray-300 space-y-1.5 list-decimal list-inside font-mono leading-relaxed pl-1">
                <li>Tap the browser 3 dots <code className="text-indigo-300">⋮</code> in top right.</li>
                <li>Select <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home screen"</strong>.</li>
                <li>ParsecWake will install with its custom app icon and launch fullscreen without browser bars!</li>
              </ol>
            </div>

            {/* iOS Steps */}
            <div className="p-4 rounded-2xl bg-[#0f1016] border border-[#ffffff08] space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-[10px] font-bold text-indigo-400 font-mono">
                  2
                </span>
                <h4 className="text-xs font-bold text-white uppercase font-mono">
                  iPhone / iPad (Safari)
                </h4>
              </div>
              <ol className="text-xs text-gray-300 space-y-1.5 list-decimal list-inside font-mono leading-relaxed pl-1">
                <li>Open this link in <strong className="text-white">Safari</strong>.</li>
                <li>Tap the <strong className="text-white">Share icon</strong> (square with arrow up).</li>
                <li>Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong> $\to$ <strong className="text-white">Add</strong>.</li>
              </ol>
            </div>

            {/* Share link button */}
            <div className="pt-2 flex items-center justify-between p-3 rounded-2xl bg-[#1a1b23] border border-[#ffffff08] text-xs font-mono">
              <span className="text-gray-400 truncate max-w-[240px]">{currentUrl}</span>
              <button
                onClick={() => copyToClipboard('url', currentUrl)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors"
              >
                {copiedCmd === 'url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCmd === 'url' ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Turn into Standalone Android APK with Capacitor */}
        {activeTab === 'apk' && (
          <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            <p className="text-xs text-gray-400 font-mono">
              Turn this exact React codebase into a signed <strong className="text-cyan-400">.apk</strong> or Google Play package in under 3 minutes using Capacitor:
            </p>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="p-3.5 rounded-2xl bg-[#0f1016] border border-[#ffffff08] space-y-2">
                <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-bold block">
                  Step 1: Install Capacitor Dependencies
                </span>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#050507] border border-[#ffffff08] font-mono text-xs text-cyan-300">
                  <code>npm install @capacitor/core @capacitor/cli @capacitor/android</code>
                  <button
                    onClick={() =>
                      copyToClipboard('cap1', 'npm install @capacitor/core @capacitor/cli @capacitor/android')
                    }
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    {copiedCmd === 'cap1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-2xl bg-[#0f1016] border border-[#ffffff08] space-y-2">
                <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-bold block">
                  Step 2: Initialize & Build Android Project
                </span>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#050507] border border-[#ffffff08] font-mono text-xs text-cyan-300">
                  <code>npx cap init ParsecWake com.parsecwake.app --web-dir dist</code>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        'cap2',
                        'npx cap init ParsecWake com.parsecwake.app --web-dir dist\nnpm run build\nnpx cap add android\nnpx cap open android'
                      )
                    }
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    {copiedCmd === 'cap2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 rounded-2xl bg-[#0f1016] border border-[#ffffff08] space-y-2">
                <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-bold block">
                  Step 3: Compile APK
                </span>
                <p className="text-[11px] text-gray-400 font-mono">
                  Android Studio opens automatically. Click <strong className="text-white">Build $\to$ Build Bundle(s) / APK(s) $\to$ Build APK(s)</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Desktop App (Tauri / Electron) */}
        {activeTab === 'desktop' && (
          <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            <p className="text-xs text-gray-400 font-mono">
              Package into a lightweight native Windows (<code className="text-purple-400">.exe</code>) or macOS (<code className="text-purple-400">.dmg</code>) tray application:
            </p>

            <div className="p-3.5 rounded-2xl bg-[#0f1016] border border-[#ffffff08] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-widest text-purple-400 font-bold">
                  Tauri (Super lightweight ~5MB EXE)
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      'tauri',
                      'npm install @tauri-apps/cli -D\nnpx tauri init\nnpx tauri build'
                    )
                  }
                  className="flex items-center gap-1 text-[11px] text-purple-300 font-mono hover:text-white"
                >
                  {copiedCmd === 'tauri' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCmd === 'tauri' ? 'Copied' : 'Copy Commands'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-[#050507] border border-[#ffffff08] font-mono text-[11px] text-purple-300 leading-relaxed">
{`# 1. Initialize Tauri in project root
npx tauri init

# 2. Build standalone desktop installer (.msi / .exe)
npm run build
npx tauri build`}
              </pre>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-[#ffffff10] bg-[#0a0a0e] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-[#1a1b23] hover:bg-[#252836] text-gray-300 text-xs font-mono transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
