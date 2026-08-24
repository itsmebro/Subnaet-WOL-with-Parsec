import { SubnetCalcResult } from '../types';

// Common MAC OUI vendor prefix database for gaming motherboards & NICs
const KNOWN_OUIs: Record<string, string> = {
  '00:1A:2B': 'ASUS (ASUSTeK Computer Inc.)',
  '04:D4:C4': 'ASUS ROG Motherboard',
  '2C:FD:A1': 'MSI (Micro-Star International)',
  'D8:BB:C1': 'MSI Gaming Series',
  'E0:D5:5E': 'GIGABYTE / AORUS',
  '70:85:C2': 'ASRock Fatal1ty/Taichi',
  '00:15:5D': 'Microsoft Hyper-V / Virtual NIC',
  '00:1B:21': 'Intel Ethernet Controller (I225-V / I226-V)',
  '00:E0:4C': 'Realtek PCIe GbE / 2.5GbE Family Controller',
  '54:BF:64': 'Realtek Gaming 2.5GbE',
  'B4:2E:99': 'Intel Gigabit / Wi-Fi 6E AX210',
  'A8:5E:45': 'Intel Killer Wi-Fi / Ethernet',
  'DC:A6:32': 'Raspberry Pi Foundation',
  'B8:27:EB': 'Raspberry Pi Foundation',
  'E4:5F:01': 'Raspberry Pi 4 / 5',
  '00:0C:29': 'VMware ESXi / Workstation',
  'BC:24:11': 'Apple Mac / Mac mini',
};

export function lookupVendor(mac: string): string {
  const clean = mac.toUpperCase().replace(/[^A-F0-9]/g, '');
  if (clean.length < 6) return 'Unknown Hardware';
  const prefix = `${clean.slice(0, 2)}:${clean.slice(2, 4)}:${clean.slice(4, 6)}`;
  
  if (KNOWN_OUIs[prefix]) {
    return KNOWN_OUIs[prefix];
  }

  // Common manufacturer substrings
  if (clean.startsWith('00E04C') || clean.startsWith('54BF64') || clean.startsWith('2C56DC')) {
    return 'Realtek 2.5G Gaming LAN';
  }
  if (clean.startsWith('001B21') || clean.startsWith('B42E99') || clean.startsWith('A85E45')) {
    return 'Intel Ethernet / Killer NIC';
  }
  if (clean.startsWith('04D4C4') || clean.startsWith('001A2B') || clean.startsWith('F02F74')) {
    return 'ASUS ROG / TUF Gaming';
  }
  if (clean.startsWith('2CFDA1') || clean.startsWith('D8BBC1')) {
    return 'MSI Gaming / MEG Series';
  }

  return 'Custom PC / Dedicated NIC';
}

export function formatMacAddress(input: string): string {
  const clean = input.replace(/[^a-fA-F0-9]/g, '').slice(0, 12).toUpperCase();
  const parts: string[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    parts.push(clean.slice(i, i + 2));
  }
  return parts.join(':');
}

export function isValidMac(mac: string): boolean {
  const clean = mac.replace(/[^a-fA-F0-9]/g, '');
  return clean.length === 12;
}

export function calculateSubnetDetails(ip: string, subnetMask: string): SubnetCalcResult | null {
  const cleanIp = ip.trim();
  const ipParts = cleanIp.split('.').map(Number);
  
  if (ipParts.length !== 4 || ipParts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return null;
  }

  let cidr = 24;
  let maskParts: number[] = [255, 255, 255, 0];

  const maskTrimmed = subnetMask.trim();
  if (maskTrimmed.startsWith('/')) {
    cidr = parseInt(maskTrimmed.replace('/', ''), 10);
    if (isNaN(cidr) || cidr < 0 || cidr > 32) return null;
    const maskNum = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
    maskParts = [
      (maskNum >>> 24) & 255,
      (maskNum >>> 16) & 255,
      (maskNum >>> 8) & 255,
      maskNum & 255,
    ];
  } else if (maskTrimmed.includes('.')) {
    maskParts = maskTrimmed.split('.').map(Number);
    if (maskParts.length !== 4 || maskParts.some(p => isNaN(p) || p < 0 || p > 255)) {
      return null;
    }
    // Calculate CIDR from dotted decimal
    const binStr = maskParts.map(p => p.toString(2).padStart(8, '0')).join('');
    cidr = binStr.indexOf('0') === -1 ? 32 : binStr.indexOf('0');
  }

  const netParts = ipParts.map((part, i) => part & maskParts[i]);
  const bcastParts = ipParts.map((part, i) => (part & maskParts[i]) | (~maskParts[i] & 255));
  const wildcardParts = maskParts.map(part => 255 - part);

  const hostBits = 32 - cidr;
  const hostCount = hostBits >= 2 ? Math.pow(2, hostBits) - 2 : (hostBits === 1 ? 2 : 1);

  return {
    networkIp: netParts.join('.'),
    broadcastIp: bcastParts.join('.'),
    hostCount,
    cidr,
    wildcardMask: wildcardParts.join('.'),
  };
}
