/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Zap,
  Activity,
  Radio,
  Search,
  History,
  ChevronRight,
} from 'lucide-react';
import { GamingRig, ActiveSession, WolHistoryLog, ParsecPreset } from './types';
import {
  loadRigs,
  saveRigs,
  loadHistory,
  saveHistory,
  loadActiveSession,
  saveActiveSession,
  checkHostStatus,
} from './services/wolService';
import { launchParsecSession } from './services/parsecService';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { RigCard } from './components/RigCard';
import { RigModal } from './components/RigModal';
import { WakeSessionModal } from './components/WakeSessionModal';
import { InSessionBar } from './components/InSessionBar';
import { ParsecView } from './components/ParsecView';
import { SubnetRelayView } from './components/SubnetRelayView';
import { GuidesView } from './components/GuidesView';
import { TestPacketModal } from './components/TestPacketModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('rigs');
  const [rigs, setRigs] = useState<GamingRig[]>(() => loadRigs());
  const [history, setHistory] = useState<WolHistoryLog[]>(() => loadHistory());
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(() => loadActiveSession());

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline'>('all');

  // Modals state
  const [selectedRigForWake, setSelectedRigForWake] = useState<GamingRig | null>(null);
  const [editingRig, setEditingRig] = useState<GamingRig | null>(null);
  const [isAddingRig, setIsAddingRig] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [pingingRigId, setPingingRigId] = useState<string | null>(null);

  // Sync rigs to localStorage
  useEffect(() => {
    saveRigs(rigs);
  }, [rigs]);

  // Sync history to localStorage
  useEffect(() => {
    saveHistory(history);
  }, [history]);

  // Sync active session
  useEffect(() => {
    saveActiveSession(activeSession);
  }, [activeSession]);

  // Handle WoL Trigger
  const handleWake = (rig: GamingRig) => {
    setSelectedRigForWake(rig);

    // Add to history
    const log: WolHistoryLog = {
      id: `log_${Date.now()}`,
      rigId: rig.id,
      rigName: rig.name,
      timestamp: new Date().toISOString(),
      strategy: rig.strategy,
      destination: rig.calculatedBroadcastIp || rig.targetIp,
      mac: rig.mac,
      port: rig.wolPort || 9,
      success: true,
      message: 'Magic Packet Dispatched',
      packetSize: 102,
    };
    setHistory((prev) => [log, ...prev.slice(0, 49)]);
  };

  // Handle Probe Ping
  const handlePing = async (rig: GamingRig) => {
    setPingingRigId(rig.id);
    const probe = await checkHostStatus(rig.targetIp, 8000, 2000);
    setPingingRigId(null);

    setRigs((prev) =>
      prev.map((r) =>
        r.id === rig.id
          ? {
              ...r,
              status: probe.isOnline ? 'online' : 'offline',
              latencyMs: probe.latencyMs,
              lastOnlineAt: probe.isOnline ? new Date().toISOString() : r.lastOnlineAt,
            }
          : r
      )
    );
  };

  // Handle Launch Parsec
  const handleLaunchParsec = (rig: GamingRig) => {
    launchParsecSession(rig);
  };

  // Start Gaming Session
  const handleStartSession = (rig: GamingRig) => {
    const session: ActiveSession = {
      rigId: rig.id,
      rigName: rig.name,
      startedAt: new Date().toISOString(),
      elapsedSeconds: 0,
      estimatedWattage: 450, // default gaming wattage
      kwhCostUsd: 0.16,
      parsecPeerId: rig.parsecPeerId,
    };
    setActiveSession(session);

    // Update rig status
    setRigs((prev) =>
      prev.map((r) => (r.id === rig.id ? { ...r, status: 'in_session' } : r))
    );
  };

  // End Active Gaming Session
  const handleEndSession = () => {
    if (activeSession) {
      setRigs((prev) =>
        prev.map((r) => (r.id === activeSession.rigId ? { ...r, status: 'online' } : r))
      );
    }
    setActiveSession(null);
  };

  // Save/Update Rig
  const handleSaveRig = (savedRig: GamingRig) => {
    setRigs((prev) => {
      const exists = prev.some((r) => r.id === savedRig.id);
      if (exists) {
        return prev.map((r) => (r.id === savedRig.id ? savedRig : r));
      }
      return [savedRig, ...prev];
    });
    setEditingRig(null);
    setIsAddingRig(false);
  };

  // Delete Rig
  const handleDeleteRig = (rigId: string) => {
    setRigs((prev) => prev.filter((r) => r.id !== rigId));
    if (activeSession?.rigId === rigId) {
      setActiveSession(null);
    }
  };

  // Update Parsec preset directly from Parsec View
  const handleUpdateRigPreset = (rigId: string, preset: ParsecPreset) => {
    setRigs((prev) =>
      prev.map((r) => (r.id === rigId ? { ...r, parsecPreset: preset } : r))
    );
  };

  // Update Status from Wake pipeline
  const handleStatusUpdate = (rigId: string, status: GamingRig['status'], latency?: number) => {
    setRigs((prev) =>
      prev.map((r) =>
        r.id === rigId
          ? {
              ...r,
              status,
              latencyMs: latency !== undefined ? latency : r.latencyMs,
              lastWokenAt: status === 'waking' ? new Date().toISOString() : r.lastWokenAt,
              lastOnlineAt: status === 'online' ? new Date().toISOString() : r.lastOnlineAt,
            }
          : r
      )
    );
  };

  // Filtered Rigs
  const filteredRigs = rigs.filter((rig) => {
    const matchesSearch =
      rig.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rig.mac.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rig.targetIp.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rig.vendor && rig.vendor.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterStatus === 'online') {
      return rig.status === 'online' || rig.status === 'in_session';
    }
    if (filterStatus === 'offline') {
      return rig.status === 'offline';
    }
    return true;
  });

  const onlineCount = rigs.filter((r) => r.status === 'online' || r.status === 'in_session').length;

  return (
    <div className="min-h-screen bg-[#050507] text-[#e0e0e0] flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative">
      {/* Immersive Ambient Glow & Cyber Grid */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1e1b4b_0%,_transparent_60%)] opacity-35 pointer-events-none z-0" />
      <div className="fixed inset-0 bg-cyber-grid pointer-events-none z-0 opacity-40" />

      {/* Top Application Header */}
      <Header
        activeSession={activeSession}
        rigCount={rigs.length}
        onlineCount={onlineCount}
        onOpenTestModal={() => setShowTestModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-5 max-w-xl mx-auto w-full relative z-10">
        {/* TAB 1: GAMING RIGS */}
        {activeTab === 'rigs' && (
          <div className="space-y-4 pb-28">
            {/* Quick action bar */}
            <div className="flex items-center justify-between gap-2.5">
              {/* Search box */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search rig, IP, or MAC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-[#1a1b23] border border-[#ffffff10] text-xs text-white placeholder-gray-500 focus:border-indigo-500/50 focus:outline-none"
                />
              </div>

              {/* Filter pills */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2.5 rounded-2xl bg-[#1a1b23] border border-[#ffffff10] text-xs text-gray-300 font-mono focus:outline-none focus:border-indigo-500/40"
              >
                <option value="all">All Rigs ({rigs.length})</option>
                <option value="online">Online ({onlineCount})</option>
                <option value="offline">Offline ({rigs.length - onlineCount})</option>
              </select>

              {/* Add Rig Button */}
              <button
                onClick={() => setIsAddingRig(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-white font-bold text-xs shadow-[0_0_15px_rgba(79,70,229,0.5)] transition-all active:scale-95 shrink-0 border border-indigo-400/30"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Rig</span>
              </button>
            </div>

            {/* List of Rigs */}
            {filteredRigs.length === 0 ? (
              <div className="text-center py-16 px-6 rounded-3xl bg-[#0f1016] border border-[#ffffff08] shadow-xl">
                <Radio className="w-10 h-10 mx-auto text-gray-600 mb-3" />
                <h3 className="text-sm font-bold text-white tracking-wide">No Gaming Rigs Found</h3>
                <p className="text-xs text-gray-400 font-mono mt-1 mb-5">
                  {searchQuery ? 'Adjust your search parameters' : 'Register your primary gaming host to start'}
                </p>
                <button
                  onClick={() => setIsAddingRig(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-white text-xs font-bold shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register PC Host</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRigs.map((rig) => (
                  <RigCard
                    key={rig.id}
                    rig={rig}
                    onWake={handleWake}
                    onEdit={(r) => setEditingRig(r)}
                    onPing={handlePing}
                    onLaunchParsec={handleLaunchParsec}
                    onStartSession={handleStartSession}
                    isPinging={pingingRigId === rig.id}
                  />
                ))}
              </div>
            )}

            {/* Recent Wake Logs Drawer */}
            <div className="pt-2">
              <button
                onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#0f1016] hover:bg-[#12141d] border border-[#ffffff08] text-xs text-gray-300 transition-colors shadow-lg"
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold text-white uppercase tracking-wider font-mono text-[11px]">
                    Recent WoL Dispatch Logs
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a1b23] text-indigo-300 font-mono font-semibold border border-[#ffffff08]">
                    {history.length}
                  </span>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    showHistoryDrawer ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {showHistoryDrawer && (
                <div className="mt-2.5 p-3 rounded-2xl bg-[#050507] border border-[#ffffff08] space-y-2 max-h-52 overflow-y-auto font-mono text-[11px]">
                  {history.length === 0 ? (
                    <p className="text-gray-500 text-center py-3">No wake history recorded yet.</p>
                  ) : (
                    history.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-xl bg-[#0f1016] border border-[#ffffff05] flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{log.rigName}</span>
                            <span className="text-[10px] text-indigo-400 font-mono">
                              ({log.destination}:{log.port})
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400">
                            MAC: {log.mac} • {log.strategy}
                          </p>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Cyber Telemetry Status Footer */}
            <div className="pt-4 px-4 py-3 rounded-2xl bg-[#0a0a0e] border border-[#ffffff05] flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] font-mono text-gray-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_6px_#6366f1]" />
                  <span>P2P_TUNNEL: ACTIVE</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                  <span>PARSEC_RELAY: READY</span>
                </div>
              </div>
              <div className="text-gray-600 uppercase tracking-tighter">
                BUILD v4.2.0-STABLE // LATENCY: 12ms
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PARSEC SUITE */}
        {activeTab === 'parsec' && (
          <ParsecView
            rigs={rigs}
            onStartSession={handleStartSession}
            onUpdateRigPreset={handleUpdateRigPreset}
          />
        )}

        {/* TAB 3: SUBNET & RELAY */}
        {activeTab === 'subnet' && <SubnetRelayView />}

        {/* TAB 4: SETUP GUIDES */}
        {activeTab === 'guides' && <GuidesView />}
      </main>

      {/* Floating Active Gaming Session Banner */}
      <InSessionBar
        session={activeSession}
        rigs={rigs}
        onEndSession={handleEndSession}
      />

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasActiveSession={!!activeSession}
      />

      {/* Automated Wake-to-Play Modal */}
      {selectedRigForWake && (
        <WakeSessionModal
          rig={selectedRigForWake}
          onClose={() => setSelectedRigForWake(null)}
          onSessionStarted={handleStartSession}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {/* Add / Edit Gaming Rig Modal */}
      {(editingRig || isAddingRig) && (
        <RigModal
          rig={editingRig}
          onSave={handleSaveRig}
          onDelete={handleDeleteRig}
          onClose={() => {
            setEditingRig(null);
            setIsAddingRig(false);
          }}
        />
      )}

      {/* Manual Packet Tester Modal */}
      {showTestModal && <TestPacketModal onClose={() => setShowTestModal(false)} />}
    </div>
  );
}
