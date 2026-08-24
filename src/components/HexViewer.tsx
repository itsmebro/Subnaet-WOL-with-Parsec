import React, { useState } from 'react';
import { Copy, Check, Info } from 'lucide-react';
import { buildMagicPacketHex } from '../services/wolService';

interface HexViewerProps {
  mac: string;
  password?: string;
  className?: string;
}

export const HexViewer: React.FC<HexViewerProps> = ({ mac, password, className = '' }) => {
  const [copied, setCopied] = useState(false);
  const packetData = buildMagicPacketHex(mac, password);

  const handleCopy = () => {
    navigator.clipboard.writeText(packetData.rawHex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-3xl bg-[#0f1016] border border-[#ffffff08] p-4 shadow-xl ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Magic Packet Payload
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono font-semibold">
            {packetData.totalBytes} Bytes (UDP)
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white transition-colors px-2.5 py-1 rounded-xl bg-[#1a1b23] hover:bg-[#252836] border border-[#ffffff08]"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy Hex'}</span>
        </button>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-1 mb-3 text-[10px] font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-amber-500/30 border border-amber-500/70 inline-block shadow-[0_0_6px_#f59e0b]" />
          <span className="text-gray-400">Preamble (6x FF)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-indigo-500/30 border border-indigo-500/70 inline-block shadow-[0_0_6px_#6366f1]" />
          <span className="text-gray-400">MAC (16x reps)</span>
        </div>
        {packetData.passwordBytes && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500/30 border border-rose-500/70 inline-block shadow-[0_0_6px_#f43f5e]" />
            <span className="text-gray-400">SecureOn (PWD)</span>
          </div>
        )}
      </div>

      {/* Hex Stream Container */}
      <div className="p-3 rounded-2xl bg-[#050507] font-mono text-[11px] leading-relaxed max-h-36 overflow-y-auto border border-[#ffffff08] select-all scrollbar-thin">
        <div className="flex flex-wrap gap-1">
          {/* Preamble */}
          {packetData.preamble.map((byte, i) => (
            <span
              key={`pre-${i}`}
              className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40"
              title={`Preamble Byte ${i + 1}/6 (0xFF)`}
            >
              {byte}
            </span>
          ))}

          {/* 16 MAC repetitions */}
          {packetData.macIterations.map((macGroup, groupIdx) => (
            <React.Fragment key={`group-${groupIdx}`}>
              {macGroup.map((byte, byteIdx) => (
                <span
                  key={`mac-${groupIdx}-${byteIdx}`}
                  className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 transition-colors"
                  title={`Target MAC Repetition #${groupIdx + 1}, Byte #${byteIdx + 1}`}
                >
                  {byte}
                </span>
              ))}
            </React.Fragment>
          ))}

          {/* SecureOn Password */}
          {packetData.passwordBytes?.map((byte, i) => (
            <span
              key={`pwd-${i}`}
              className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40"
              title={`SecureOn Password Byte #${i + 1}`}
            >
              {byte}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-2.5 text-[10px] text-gray-500 flex items-center gap-1.5 font-mono">
        <Info className="w-3 h-3 text-indigo-400 shrink-0" />
        <span>Dispatched as UDP payload directly to Layer 2 / Layer 3 socket (Port 9/7).</span>
      </div>
    </div>
  );
};
