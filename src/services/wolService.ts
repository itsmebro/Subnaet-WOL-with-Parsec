import { GamingRig, WolHistoryLog, ActiveSession, WolStrategy } from '../types';
import { calculateSubnetDetails, formatMacAddress } from './subnetService';

const STORAGE_KEYS = {
  RIGS: 'parsecwake_rigs_v2',
  HISTORY: 'parsecwake_history_v2',
  ACTIVE_SESSION: 'parsecwake_active_session_v2',
  SETTINGS: 'parsecwake_app_settings_v2',
};

export const DEFAULT_RIGS: GamingRig[] = [
  {
    id: 'rig-main-4090',
    name: 'Battlestation RTX 4090',
    icon: 'desktop',
    color: '#06b6d4', // cyan-500
    mac: '3C:7C:3F:8A:2B:19',
    targetIp: '192.168.1.150',
    subnetMask: '/24',
    calculatedBroadcastIp: '192.168.1.255',
    wolPort: 9,
    strategy: 'directed_broadcast',
    parsecPeerId: 'ksthku-4090',
    parsecPreset: {
      resolution: '2560x1440',
      fps: 120,
      bitrateMbps: 50,
      decoder: 'H.265',
      colorFormat: '4:4:4',
      audioQuality: 'High',
      virtualDisplayEnabled: true,
      autoLaunchParsec: true,
    },
    specSummary: 'AMD Ryzen 7 7800X3D • RTX 4090 24GB • 64GB DDR5 • Win 11 Pro',
    vendor: 'ASUS ROG Motherboard',
    notes: 'Subnet 192.168.1.0/24 (Target). Direct broadcast via 192.168.1.255:9',
    status: 'offline',
    estimatedBootSeconds: 18,
    quickGames: [
      { id: 'g1', name: 'Cyberpunk 2077', category: 'steam', appId: '1091500' },
      { id: 'g2', name: 'Elden Ring', category: 'steam', appId: '1245620' },
      { id: 'g3', name: 'Forza Horizon 5', category: 'xbox' },
      { id: 'g4', name: 'Steam Big Picture', category: 'steam', customUri: 'steam://open/bigpicture' },
    ],
  },
  {
    id: 'rig-living-steambox',
    name: 'Living Room Steambox',
    icon: 'tv',
    color: '#8b5cf6', // violet-500
    mac: '00:E0:4C:68:53:7E',
    targetIp: '192.168.20.45',
    subnetMask: '/24',
    calculatedBroadcastIp: '192.168.20.255',
    wolPort: 9,
    strategy: 'relay_agent',
    relayEndpoint: 'http://192.168.20.5:8088/wol',
    relayToken: 'psw-token-9948',
    parsecPeerId: 'steambox-living',
    parsecPreset: {
      resolution: '3840x2160',
      fps: 60,
      bitrateMbps: 65,
      decoder: 'H.265',
      colorFormat: '4:2:0',
      audioQuality: 'High',
      virtualDisplayEnabled: true,
      autoLaunchParsec: true,
    },
    specSummary: 'Intel Core i5-13600K • RTX 4070 Ti • 32GB DDR5 • Bazzite / Win 11',
    vendor: 'Realtek PCIe GbE',
    notes: 'Isolated IoT/Entertainment Subnet (192.168.20.0/24). Woken via local Raspberry Pi relay agent.',
    status: 'offline',
    estimatedBootSeconds: 22,
    quickGames: [
      { id: 'g5', name: 'Steam Fullscreen', category: 'steam', customUri: 'steam://open/bigpicture' },
      { id: 'g6', name: 'Playnite Fullscreen', category: 'playnite', customUri: 'playnite://playnite/fullscreen' },
    ],
  },
  {
    id: 'rig-tailscale-homelab',
    name: 'Homelab VR / AI Node',
    icon: 'server',
    color: '#ec4899', // pink-500
    mac: '2C:FD:A1:90:11:AB',
    targetIp: '100.84.192.12',
    subnetMask: '/16',
    wolPort: 9,
    strategy: 'tailscale_vpn',
    parsecPeerId: 'homelab-node-1',
    parsecPreset: {
      resolution: '1920x1080',
      fps: 120,
      bitrateMbps: 35,
      decoder: 'H.265',
      colorFormat: '4:2:0',
      audioQuality: 'Standard',
      virtualDisplayEnabled: false,
      autoLaunchParsec: false,
    },
    specSummary: 'Ryzen 9 7950X • RTX 3090 24GB • Proxmox GPU Passthrough',
    vendor: 'MSI Gaming Series',
    notes: 'Tailscale Subnet Router routed to 192.168.50.0/24.',
    status: 'offline',
    estimatedBootSeconds: 25,
  },
];

// LocalStorage helpers
export function loadRigs(): GamingRig[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RIGS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.RIGS, JSON.stringify(DEFAULT_RIGS));
      return DEFAULT_RIGS;
    }
    return JSON.parse(data);
  } catch {
    return DEFAULT_RIGS;
  }
}

export function saveRigs(rigs: GamingRig[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RIGS, JSON.stringify(rigs));
  } catch (err) {
    console.error('Failed to save rigs to localStorage:', err);
  }
}

export function loadHistory(): WolHistoryLog[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveHistory(logs: WolHistoryLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(logs.slice(0, 50)));
  } catch (err) {
    console.error('Failed to save history to localStorage:', err);
  }
}

export function loadActiveSession(): ActiveSession | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveActiveSession(session: ActiveSession | null): void {
  try {
    if (!session) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    } else {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
    }
  } catch (err) {
    console.error('Failed to save active session:', err);
  }
}

// Generate Raw Magic Packet Hex Preview
export function buildMagicPacketHex(mac: string, password?: string): {
  preamble: string[];
  macIterations: string[][];
  passwordBytes?: string[];
  totalBytes: number;
  rawHex: string;
} {
  const cleanMac = mac.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
  const macPairs = cleanMac.match(/.{1,2}/g) || ['00', '00', '00', '00', '00', '00'];

  const preamble = ['FF', 'FF', 'FF', 'FF', 'FF', 'FF'];
  const macIterations: string[][] = [];
  for (let i = 0; i < 16; i++) {
    macIterations.push([...macPairs]);
  }

  let passwordBytes: string[] | undefined;
  if (password) {
    const cleanPwd = password.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
    if (cleanPwd.length === 8 || cleanPwd.length === 12) {
      passwordBytes = cleanPwd.match(/.{1,2}/g) || [];
    }
  }

  const allBytes = [
    ...preamble,
    ...macIterations.flat(),
    ...(passwordBytes || []),
  ];

  return {
    preamble,
    macIterations,
    passwordBytes,
    totalBytes: allBytes.length,
    rawHex: allBytes.join(' '),
  };
}

// Dispatch WoL Packet
export async function sendWakeOnLan(rig: GamingRig): Promise<{
  success: boolean;
  message: string;
  packetDetails?: any;
}> {
  try {
    let destIp = rig.targetIp;

    // Subnet calculation
    if (rig.subnetMask && rig.targetIp) {
      const calc = calculateSubnetDetails(rig.targetIp, rig.subnetMask);
      if (calc) {
        destIp = calc.broadcastIp;
      }
    }

    if (rig.calculatedBroadcastIp) {
      destIp = rig.calculatedBroadcastIp;
    }

    // Check if using an external Subnet Relay Agent HTTP Endpoint
    if (rig.strategy === 'relay_agent' && rig.relayEndpoint) {
      try {
        const relayRes = await fetch(rig.relayEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(rig.relayToken ? { 'Authorization': `Bearer ${rig.relayToken}` } : {}),
          },
          body: JSON.stringify({
            mac: rig.mac,
            broadcastIp: destIp || '255.255.255.255',
            port: rig.wolPort || 9,
            password: rig.secureOnPassword,
          }),
        });

        if (relayRes.ok) {
          const resData = await relayRes.json();
          return {
            success: true,
            message: `Relay Agent triggered: ${resData.message || 'Magic Packet dispatched on target subnet'}`,
            packetDetails: resData,
          };
        }
      } catch (relayErr: any) {
        console.warn('Direct Relay Agent call failed, falling back to server broadcast:', relayErr);
      }
    }

    // Call backend API
    const response = await fetch('/api/wol/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mac: rig.mac,
        targetIp: destIp,
        port: rig.wolPort || 9,
        secureOnPassword: rig.secureOnPassword,
        subnetMask: rig.subnetMask,
        strategy: rig.strategy,
      }),
    });

    const data = await response.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to dispatch WoL magic packet',
    };
  }
}

// Ping / Probe Host Status
export async function checkHostStatus(host: string, port = 8000, timeout = 2500): Promise<{
  isOnline: boolean;
  latencyMs: number;
  statusMessage: string;
}> {
  try {
    const res = await fetch('/api/devices/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host, port, timeout }),
    });
    if (!res.ok) {
      return { isOnline: false, latencyMs: 0, statusMessage: 'Ping probe error' };
    }
    const data = await res.json();
    return {
      isOnline: !!data.isOnline,
      latencyMs: data.latencyMs || 0,
      statusMessage: data.statusMessage || '',
    };
  } catch (err: any) {
    return { isOnline: false, latencyMs: 0, statusMessage: err?.message || 'Network error' };
  }
}

// Play notification sound when host comes online
export function playWakeChime(): void {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    osc.frequency.exponentialRampToValueAtTime(1174.66, audioCtx.currentTime + 0.3); // D6

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.45);
  } catch {
    // AudioContext might be blocked before user gesture
  }
}
