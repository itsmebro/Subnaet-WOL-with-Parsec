import React from 'react';
import { Gamepad2, Network, BookOpen, MonitorPlay } from 'lucide-react';

export type TabType = 'rigs' | 'parsec' | 'subnet' | 'guides';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  hasActiveSession?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  hasActiveSession,
}) => {
  const tabs = [
    {
      id: 'rigs' as TabType,
      label: 'Gaming Rigs',
      icon: Gamepad2,
      badge: hasActiveSession ? 'LIVE' : null,
    },
    {
      id: 'parsec' as TabType,
      label: 'Parsec Hub',
      icon: MonitorPlay,
    },
    {
      id: 'subnet' as TabType,
      label: 'Subnet Relay',
      icon: Network,
    },
    {
      id: 'guides' as TabType,
      label: 'WoL Guide',
      icon: BookOpen,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0e]/95 backdrop-blur-2xl border-t border-[#ffffff10] pb-safe shadow-[0_-10px_35px_rgba(0,0,0,0.8)]">
      <div className="max-w-2xl mx-auto grid grid-cols-4 px-3 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-white'
                  : 'text-gray-400 hover:text-gray-200 active:scale-95'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-br from-indigo-600/30 to-blue-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_12px_rgba(79,70,229,0.35)]'
                      : 'text-gray-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 bg-emerald-500 text-[8px] font-bold text-slate-950 rounded-full animate-pulse shadow-[0_0_8px_#10b981]">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 tracking-wider uppercase font-mono ${
                  isActive ? 'text-indigo-300 font-bold' : 'text-gray-400 font-medium'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
