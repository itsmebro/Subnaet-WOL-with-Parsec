export type WolStrategy = 
  | 'directed_broadcast'
  | 'relay_agent'
  | 'tailscale_vpn'
  | 'wan_port_forward'
  | 'ssh_bridge';

export interface ParsecPreset {
  resolution: '1920x1080' | '2560x1440' | '3840x2160' | '3440x1440' | '2400x1080' | '1280x800' | 'custom';
  customResolution?: string;
  fps: 60 | 120 | 144 | 240;
  bitrateMbps: number;
  decoder: 'H.265' | 'H.264' | 'AV1';
  colorFormat: '4:2:0' | '4:4:4';
  audioQuality: 'High' | 'Standard';
  virtualDisplayEnabled: boolean;
  autoLaunchParsec: boolean;
}

export interface QuickGame {
  id: string;
  name: string;
  category: 'steam' | 'epic' | 'xbox' | 'playnite' | 'emulator' | 'custom';
  appId?: string;
  icon?: string;
  customUri?: string;
}

export interface GamingRig {
  id: string;
  name: string;
  icon: 'desktop' | 'laptop' | 'server' | 'tv' | 'gamepad' | 'vr';
  color: string;
  mac: string;
  targetIp: string;
  subnetMask: string; // e.g. "/24" or "255.255.255.0"
  calculatedBroadcastIp?: string;
  wolPort: number; // 7, 9, or custom
  secureOnPassword?: string; // 6-byte hex
  strategy: WolStrategy;
  
  // Relay configuration
  relayEndpoint?: string; // e.g., http://192.168.1.200:8088/wol
  relayToken?: string;

  // Parsec settings
  parsecPeerId?: string; // Peer ID or Server ID
  parsecShareLink?: string; // e.g. https://parsec.gg/...
  parsecPreset: ParsecPreset;

  // Sunshine / Moonlight fallback
  moonlightHost?: string;

  // Machine specs & info
  specSummary?: string;
  vendor?: string;
  notes?: string;
  quickGames?: QuickGame[];

  // Live state
  status: 'offline' | 'waking' | 'online' | 'in_session';
  lastWokenAt?: string;
  lastOnlineAt?: string;
  latencyMs?: number;
  estimatedBootSeconds: number; // default ~20s
}

export interface WolHistoryLog {
  id: string;
  rigId: string;
  rigName: string;
  timestamp: string;
  strategy: WolStrategy;
  destination: string;
  mac: string;
  port: number;
  success: boolean;
  message: string;
  packetSize: number;
}

export interface SubnetCalcResult {
  networkIp: string;
  broadcastIp: string;
  hostCount: number;
  cidr: number;
  wildcardMask: string;
}

export interface ActiveSession {
  rigId: string;
  rigName: string;
  startedAt: string;
  elapsedSeconds: number;
  estimatedWattage: number; // in Watts (e.g. 450W for 7800X3D + 4090)
  kwhCostUsd: number; // default $0.16/kWh
  parsecPeerId?: string;
}
