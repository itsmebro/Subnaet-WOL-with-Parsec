import React, { useState } from 'react';
import { X, Send, Zap } from 'lucide-react';
import { formatMacAddress, isValidMac } from '../services/subnetService';
import { sendWakeOnLan } from '../services/wolService';
import { GamingRig } from '../types';

interface TestPacketModalProps {
  onClose: () => void;
}

export const TestPacketModal: React.FC<TestPacketModalProps> = ({ onClose }) => {
  const [mac, setMac] = useState('3C:7C:3F:8A:2B:19');
  const [destIp, setDestIp] = useState('255.255.255.255');
  const [port, setPort] = useState(9);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidMac(mac)) {
      setResult({ success: false, message: 'Invalid 12-char MAC address.' });
      return;
    }

    setLoading(true);
    setResult(null);

    const dummyRig: GamingRig = {
      id: 'quick-test',
      name: 'Quick Test',
      icon: 'desktop',
      color: '#4f46e5',
      mac: formatMacAddress(mac),
      targetIp: destIp.trim() || '255.255.255.255',
      subnetMask: '/24',
      wolPort: port,
      secureOnPassword: password.trim() || undefined,
      strategy: 'directed_broadcast',
      parsecPreset: {
        resolution: '1920x1080',
        fps: 60,
        bitrateMbps: 30,
        decoder: 'H.265',
        colorFormat: '4:2:0',
        audioQuality: 'Standard',
        virtualDisplayEnabled: false,
        autoLaunchParsec: false,
      },
      status: 'offline',
      estimatedBootSeconds: 20,
    };

    const res = await sendWakeOnLan(dummyRig);
    setLoading(false);
    setResult(res);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050507]/90 backdrop-blur-xl">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-br from-[#12141d] to-[#0a0a0e] border border-[#ffffff15] shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#ffffff10]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
              <Zap className="w-4 h-4 text-indigo-400 fill-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">WoL Packet Tester</h3>
              <span className="text-[9px] font-mono text-gray-500">Direct Layer 2/3 Dispatch</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-xl bg-[#1a1b23] border border-[#ffffff08] text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSend} className="mt-4 space-y-3">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">
              Target MAC Address
            </label>
            <input
              type="text"
              value={mac}
              onChange={(e) => setMac(formatMacAddress(e.target.value))}
              placeholder="3C:7C:3F:8A:2B:19"
              required
              className="w-full px-3 py-2 rounded-xl bg-[#1a1b23] border border-[#ffffff10] font-mono text-xs text-white focus:outline-none focus:border-indigo-500/50 uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">
                Destination IP
              </label>
              <input
                type="text"
                value={destIp}
                onChange={(e) => setDestIp(e.target.value)}
                placeholder="255.255.255.255"
                className="w-full px-3 py-2 rounded-xl bg-[#1a1b23] border border-[#ffffff10] font-mono text-xs text-white focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">
                UDP Port
              </label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                placeholder="9"
                className="w-full px-3 py-2 rounded-xl bg-[#1a1b23] border border-[#ffffff10] font-mono text-xs text-white focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">
              SecureOn Password (Optional)
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="e.g. AA:BB:CC:DD:EE:FF"
              className="w-full px-3 py-2 rounded-xl bg-[#1a1b23] border border-[#ffffff10] font-mono text-xs text-white focus:outline-none focus:border-indigo-500/50 uppercase"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(79,70,229,0.35)] transition-all active:scale-95 disabled:opacity-50 border border-indigo-400/30"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? 'Dispatching...' : 'Broadcast Magic Packet'}</span>
          </button>
        </form>

        {/* Result */}
        {result && (
          <div
            className={`mt-3.5 p-3 rounded-2xl border text-xs font-mono ${
              result.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <p className="font-semibold">{result.message}</p>
            {result.packetDetails?.hexString && (
              <p className="text-[9px] text-gray-400 mt-1 truncate">
                Hex: {result.packetDetails.hexString.slice(0, 40)}...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
