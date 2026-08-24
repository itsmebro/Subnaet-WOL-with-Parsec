import React, { useEffect, useState, useRef } from 'react';
import {
  X,
  Zap,
  MonitorPlay,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  RotateCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GamingRig } from '../types';
import { sendWakeOnLan, checkHostStatus, playWakeChime } from '../services/wolService';
import { launchParsecSession, getParsecWebUrl } from '../services/parsecService';

interface WakeSessionModalProps {
  rig: GamingRig | null;
  onClose: () => void;
  onSessionStarted: (rig: GamingRig) => void;
  onStatusUpdate: (rigId: string, status: GamingRig['status'], latency?: number) => void;
}

export const WakeSessionModal: React.FC<WakeSessionModalProps> = ({
  rig,
  onClose,
  onSessionStarted,
  onStatusUpdate,
}) => {
  if (!rig) return null;

  const [step, setStep] = useState<'sending' | 'probing' | 'online' | 'failed'>('sending');
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [secondsRemaining, setSecondsRemaining] = useState(rig.estimatedBootSeconds || 20);
  const [latency, setLatency] = useState<number | null>(null);
  const [packetDetails, setPacketDetails] = useState<any>(null);
  const pollingRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setLogMessages((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 6)]);
  };

  const startWoLPipeline = async () => {
    setStep('sending');
    setLogMessages([]);
    setSecondsRemaining(rig.estimatedBootSeconds || 20);

    addLog(`Broadcasting WoL Magic Packet for ${rig.name}...`);
    addLog(`Subnet: ${rig.targetIp} (${rig.strategy.replace('_', ' ')})`);

    const result = await sendWakeOnLan(rig);

    if (!result.success) {
      addLog(`❌ WoL Broadcast failed: ${result.message}`);
      setStep('failed');
      return;
    }

    setPacketDetails(result.packetDetails);
    addLog(`✅ Magic Packet (102B) sent to UDP:${rig.wolPort || 9}`);
    addLog(`⏳ Host powering on. Listening for TCP/Parsec handshake...`);
    setStep('probing');
    onStatusUpdate(rig.id, 'waking');

    // Countdown ticker
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    // Active polling ping probe every 2.5s
    let attempts = 0;
    const maxAttempts = 24; // 60 seconds total

    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = window.setInterval(async () => {
      attempts++;
      addLog(`[Probe #${attempts}] Testing TCP reachability on ${rig.targetIp}...`);

      const probe = await checkHostStatus(rig.targetIp, 8000, 2000);

      if (probe.isOnline) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        if (timerRef.current) clearInterval(timerRef.current);

        setLatency(probe.latencyMs);
        setStep('online');
        onStatusUpdate(rig.id, 'online', probe.latencyMs);
        addLog(`🎉 Host IS ONLINE! Latency: ${probe.latencyMs}ms`);

        // Sound chime & confetti celebration
        playWakeChime();
        try {
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#4f46e5', '#3b82f6', '#10b981', '#f43f5e'],
          });
        } catch {
          // ignore
        }

        // Auto launch Parsec if enabled in presets
        if (rig.parsecPreset?.autoLaunchParsec) {
          setTimeout(() => {
            launchParsecSession(rig);
          }, 800);
        }
      } else if (attempts >= maxAttempts) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        addLog(`⚠️ Host did not respond within 60s. PC might still be initializing.`);
        setStep('failed');
      }
    }, 2500);
  };

  useEffect(() => {
    startWoLPipeline();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [rig.id]);

  const handleLaunchNow = () => {
    launchParsecSession(rig);
    onSessionStarted(rig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050507]/90 backdrop-blur-xl">
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-br from-[#12141d] to-[#0a0a0e] border border-[#ffffff15] shadow-2xl p-6 overflow-hidden">
        {/* Glowing Background Ambiance */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_#1e1b4b_0%,_transparent_65%)] opacity-40 pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-[#1a1b23] border border-[#ffffff10] text-gray-400 hover:text-white flex items-center justify-center transition-colors z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Title */}
        <div className="relative z-10 text-center pt-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-gray-500">
              Host Dispatch Pipeline
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">{rig.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-xs font-mono text-indigo-400">{rig.targetIp}</span>
            <span className="text-gray-600">•</span>
            <span className="text-xs font-mono text-gray-400">{rig.mac}</span>
          </div>
        </div>

        {/* Big Holographic Wake Centerpiece */}
        <div className="relative z-10 flex flex-col items-center justify-center py-6">
          <div className="relative group">
            {/* Ambient Radial Glow */}
            <div
              className={`absolute -inset-8 rounded-full blur-[50px] transition-opacity duration-700 ${
                step === 'online'
                  ? 'bg-emerald-500/30'
                  : step === 'failed'
                  ? 'bg-red-500/20'
                  : 'bg-indigo-600/30'
              }`}
            />

            {/* Glowing Orb Button */}
            <div className="relative w-36 h-36 rounded-full bg-[#1a1b23] border-4 border-[#ffffff10] flex flex-col items-center justify-center gap-1 shadow-2xl">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 ${
                  step === 'online'
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-[0_0_25px_rgba(16,185,129,0.7)]'
                    : step === 'failed'
                    ? 'bg-gradient-to-tr from-amber-600 to-red-500 shadow-[0_0_25px_rgba(239,68,68,0.5)]'
                    : 'bg-gradient-to-tr from-indigo-600 to-blue-400 shadow-[0_0_25px_rgba(79,70,229,0.7)] animate-pulse'
                }`}
              >
                {step === 'online' ? (
                  <CheckCircle2 className="w-8 h-8 text-white" />
                ) : step === 'failed' ? (
                  <AlertTriangle className="w-8 h-8 text-white" />
                ) : (
                  <Zap className="w-8 h-8 text-white fill-white" />
                )}
              </div>

              <span className="text-[11px] font-extrabold tracking-widest uppercase text-white mt-1">
                {step === 'online'
                  ? 'ONLINE'
                  : step === 'probing'
                  ? 'BOOTING...'
                  : step === 'failed'
                  ? 'NO PING'
                  : 'WAKING'}
              </span>
              <span className="text-[9px] font-mono text-gray-400">
                {step === 'online' ? `${latency}ms` : `~${secondsRemaining}s`}
              </span>
            </div>
          </div>
        </div>

        {/* Status Progress Details */}
        <div className="relative z-10 px-4 py-3 rounded-2xl bg-[#0f1016] border border-[#ffffff08]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[11px] font-mono uppercase text-gray-400">
              {step === 'online'
                ? 'Ready for remote gaming'
                : step === 'probing'
                ? `Pinging host port 8000 (~${secondsRemaining}s)`
                : step === 'failed'
                ? 'Host not reachable yet'
                : 'Transmitting UDP packet'}
            </span>
            <span className="text-[11px] font-mono text-indigo-400 font-bold">
              {step === 'online' ? '100%' : `${Math.max(15, Math.round(((rig.estimatedBootSeconds - secondsRemaining) / rig.estimatedBootSeconds) * 100))}%`}
            </span>
          </div>

          <div className="w-full bg-[#1a1b23] rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-700 ${
                step === 'online'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-indigo-500 to-blue-400'
              }`}
              style={{
                width:
                  step === 'online'
                    ? '100%'
                    : `${Math.max(
                        10,
                        ((rig.estimatedBootSeconds - secondsRemaining) /
                          rig.estimatedBootSeconds) *
                          100
                      )}%`,
              }}
            />
          </div>
        </div>

        {/* Live Logs Terminal */}
        <div className="relative z-10 mt-3 p-3 rounded-2xl bg-[#00000050] border border-[#ffffff08] font-mono text-[10px] text-gray-400 max-h-24 overflow-y-auto select-all">
          {logMessages.map((log, idx) => (
            <div key={idx} className="leading-relaxed py-0.5 truncate">
              {log}
            </div>
          ))}
        </div>

        {/* Parsec Integration Bottom Bar & Action Trigger */}
        <div className="relative z-10 mt-4 flex items-center gap-3 p-3.5 rounded-2xl bg-[#00000040] border border-[#ffffff08]">
          <div className="w-10 h-10 rounded-xl bg-[#f34b3e] flex items-center justify-center shadow-[0_0_15px_rgba(243,75,62,0.3)] shrink-0">
            <MonitorPlay className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white tracking-wide">Parsec Integration</h4>
            <p className="text-[10px] text-gray-400 truncate">
              {step === 'online'
                ? 'Host ready. Click to initialize stream.'
                : 'Stream activates once host is reachable.'}
            </p>
          </div>

          <button
            onClick={handleLaunchNow}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 ${
              step === 'online'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] hover:brightness-110'
                : 'bg-[#ffffff10] text-gray-300 hover:bg-[#ffffff18] hover:text-white'
            }`}
          >
            {step === 'online' ? 'Connect' : 'Connect Now'}
          </button>
        </div>

        {/* Secondary Actions */}
        <div className="relative z-10 mt-3 flex items-center justify-between gap-2">
          <button
            onClick={startWoLPipeline}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#1a1b23] hover:bg-[#252836] border border-[#ffffff08] text-gray-300 text-xs font-medium transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Resend Packet</span>
          </button>

          <a
            href={getParsecWebUrl(rig)}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#1a1b23] hover:bg-[#252836] border border-[#ffffff08] text-gray-400 hover:text-white text-xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Web Client</span>
          </a>
        </div>
      </div>
    </div>
  );
};
