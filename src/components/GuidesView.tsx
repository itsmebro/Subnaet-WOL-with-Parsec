import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Cpu,
  Monitor,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Zap,
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  category: 'bios' | 'windows' | 'router' | 'tailscale';
  icon: any;
  summary: string;
  steps: string[];
  commandSnippet?: string;
  troubleshootingTip: string;
}

const GUIDES: GuideSection[] = [
  {
    id: 'bios',
    title: '1. Motherboard BIOS / UEFI Configuration',
    category: 'bios',
    icon: Cpu,
    summary: 'Enable PCI-E Wake events and disable deep ErP sleep states.',
    steps: [
      'Reboot your gaming PC and tap Del or F2 to enter BIOS/UEFI.',
      'ASUS: Go to Advanced -> APM Configuration -> Enable "Power On By PCI-E".',
      'MSI: Go to Settings -> Advanced -> Wake Up Event Setup -> Set "Resume by PCI-E Device" to Enabled.',
      'Gigabyte / AORUS: Go to Power Settings -> Enable "Wake on LAN / PCI-E".',
      'ASRock: Go to Advanced -> ACPI Configuration -> Enable "PCIE Devices Power On".',
      'CRITICAL: Disable "ErP Ready" / "Deep Sleep" (ErP cuts +5VSB standby power to the NIC ethernet port when shut down).',
      'Save changes (F10) and boot into Windows.',
    ],
    troubleshootingTip:
      'Look at your ethernet port when the PC is turned off: the link LED MUST remain illuminated (green or orange). If the LED is dark, ErP is cutting power.',
  },
  {
    id: 'windows',
    title: '2. Windows 11/10 Network Adapter & Fast Startup',
    category: 'windows',
    icon: Monitor,
    summary: 'Prevent Windows Fast Startup from putting NIC into non-wakeable S5 shutdown.',
    steps: [
      'Disable Fast Startup: Open Control Panel -> Power Options -> "Choose what the power button does" -> Click "Change settings currently unavailable" -> Uncheck "Turn on fast startup" -> Save.',
      'Device Manager: Press Win + X -> Device Manager -> Expand "Network Adapters".',
      'Double-click your Ethernet NIC (Intel I225-V, Realtek GbE, etc.) -> "Power Management" tab.',
      'Check "Allow this device to wake the computer" and "Only allow a magic packet to wake the computer".',
      'Go to "Advanced" tab: Enable "Wake on Magic Packet", Enable "Shutdown Wake-On-Lan".',
      'Set "Energy Efficient Ethernet" and "Green Ethernet" to Disabled.',
    ],
    commandSnippet: `powercfg /hibernate off`,
    troubleshootingTip:
      'If Fast Startup is active, Windows shuts down into a hybrid hibernation state that ignores standard WoL packets.',
  },
  {
    id: 'router',
    title: '3. Cross-Subnet Router & IP Directed Broadcast',
    category: 'router',
    icon: AlertCircle,
    summary: 'Enable router forwarding to broadcast address or set static ARP binding.',
    steps: [
      'Why standard WoL fails across subnets: Routers discard broadcast packets (255.255.255.255) at the gateway boundary.',
      'Solution A (Directed Broadcast): In your router or firewall, enable "IP Directed Broadcast" to allow routing to subnet broadcast IP (e.g., 192.168.1.255:9).',
      'Solution B (Static ARP): Bind your gaming PC\'s MAC address to its IP in the router ARP table, so the router remembers the port even when the PC is off.',
      'Solution C (Subnet Relay): Run our lightweight Subnet Relay Daemon on a 24/7 Raspberry Pi / Home Assistant device located on the target subnet.',
    ],
    troubleshootingTip:
      'When your PC has been off for 10+ minutes, standard router ARP tables expire. A Subnet Relay or directed broadcast bypasses ARP table timeouts.',
  },
  {
    id: 'tailscale',
    title: '4. Tailscale VPN Subnet Router (Wake from Anywhere)',
    category: 'tailscale',
    icon: Zap,
    summary: 'The easiest, most secure method to wake gaming rigs from 5G / cellular anywhere.',
    steps: [
      'Install Tailscale on a 24/7 device on your home network (Raspberry Pi, Linux mini-PC, Apple TV, etc.).',
      'Run the subnet router advertise command in terminal.',
      'Approve the route in the Tailscale admin console.',
      'Install Tailscale on your mobile phone and connect.',
      'Now your mobile phone can directly send WoL packets to 192.168.1.255 from anywhere in the world!',
    ],
    commandSnippet: `sudo tailscale up --advertise-routes=192.168.1.0/24 --accept-routes`,
    troubleshootingTip:
      'Tailscale requires zero port forwarding, no DDNS, and works behind double-NAT or CGNAT (Starlink, 5G Home Internet).',
  },
];

export const GuidesView: React.FC = () => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    bios: true,
    windows: true,
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4 pb-28 max-w-xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#12141d] to-[#0a0a0e] border border-[#ffffff10] p-5 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(79,70,229,0.5)] border border-indigo-400/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">
              Wake-on-LAN Master Guide
            </h2>
            <p className="text-xs text-indigo-300 font-mono">
              BIOS, Windows NIC, Subnet Routing & Tailscale
            </p>
          </div>
        </div>
      </div>

      {/* Guide Accordions */}
      <div className="space-y-3.5">
        {GUIDES.map((guide) => {
          const isOpen = !!openSections[guide.id];
          const Icon = guide.icon;

          return (
            <div
              key={guide.id}
              className="rounded-3xl bg-[#0f1016] border border-[#ffffff08] overflow-hidden shadow-xl transition-all"
            >
              {/* Accordion Header */}
              <button
                onClick={() => toggleSection(guide.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[#1a1b23]/50 transition-colors"
              >
                <div className="flex items-center gap-3 pr-2">
                  <div className="w-9 h-9 rounded-xl bg-[#1a1b23] border border-[#ffffff08] flex items-center justify-center text-indigo-400 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-snug">{guide.title}</h3>
                    <p className="text-xs text-gray-400 font-mono">{guide.summary}</p>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                )}
              </button>

              {/* Accordion Body */}
              {isOpen && (
                <div className="p-4 pt-0 border-t border-[#ffffff08] space-y-3 mt-2">
                  <ol className="space-y-2 text-xs text-gray-300 list-decimal list-inside leading-relaxed font-mono">
                    {guide.steps.map((step, idx) => (
                      <li key={idx} className="pl-1">
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>

                  {/* Command Snippet */}
                  {guide.commandSnippet && (
                    <div className="mt-2 p-3 rounded-2xl bg-[#050507] border border-[#ffffff08] flex items-center justify-between font-mono text-xs text-indigo-300">
                      <span className="truncate pr-2">{guide.commandSnippet}</span>
                      <button
                        onClick={() => handleCopy(guide.id, guide.commandSnippet!)}
                        className="px-2.5 py-1 rounded-xl bg-[#1a1b23] hover:bg-[#252836] text-gray-300 hover:text-white transition-colors flex items-center gap-1 shrink-0 border border-[#ffffff08]"
                      >
                        {copiedId === guide.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedId === guide.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}

                  {/* Pro Tip */}
                  <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-2.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-indigo-300 block uppercase tracking-wider font-mono text-[10px]">
                        Pro Tip:
                      </span>
                      <span className="text-gray-300 font-mono text-[11px]">{guide.troubleshootingTip}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
