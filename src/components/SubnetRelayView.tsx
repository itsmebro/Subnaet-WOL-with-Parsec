import React, { useState } from 'react';
import {
  Calculator,
  Terminal,
  Copy,
  Check,
  Send,
  Zap,
} from 'lucide-react';
import { calculateSubnetDetails, formatMacAddress, isValidMac } from '../services/subnetService';
import { HexViewer } from './HexViewer';
import { sendWakeOnLan } from '../services/wolService';
import { GamingRig } from '../types';

export const SubnetRelayView: React.FC = () => {
  // Subnet calculator state
  const [calcIp, setCalcIp] = useState('192.168.1.150');
  const [calcMask, setCalcMask] = useState('/24');
  const [calcResult, setCalcResult] = useState(() => calculateSubnetDetails('192.168.1.150', '/24'));

  // Hex visualizer / quick test state
  const [testMac, setTestMac] = useState('3C:7C:3F:8A:2B:19');
  const [testPassword, setTestPassword] = useState('');
  const [testTargetIp, setTestTargetIp] = useState('192.168.1.255');
  const [testPort, setTestPort] = useState(9);
  const [sendingTest, setSendingTest] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  // Relay script selector
  const [scriptType, setScriptType] = useState<'python' | 'docker' | 'node' | 'tailscale' | 'router'>('python');
  const [copiedScript, setCopiedScript] = useState(false);

  const handleCalc = (ip: string, mask: string) => {
    setCalcIp(ip);
    setCalcMask(mask);
    const res = calculateSubnetDetails(ip, mask);
    setCalcResult(res);
    if (res) {
      setTestTargetIp(res.broadcastIp);
    }
  };

  const handleDispatchTest = async () => {
    if (!isValidMac(testMac)) {
      setTestStatus('Invalid MAC address format.');
      return;
    }

    setSendingTest(true);
    setTestStatus('Broadcasting Magic Packet across subnet...');

    const dummyRig: GamingRig = {
      id: 'test-rig',
      name: 'Test Rig',
      icon: 'desktop',
      color: '#4f46e5',
      mac: testMac,
      targetIp: testTargetIp,
      subnetMask: calcMask,
      calculatedBroadcastIp: testTargetIp,
      wolPort: testPort,
      secureOnPassword: testPassword || undefined,
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
    setSendingTest(false);

    if (res.success) {
      setTestStatus(`✅ Packet dispatched to ${testTargetIp}:${testPort}! Check target PC.`);
    } else {
      setTestStatus(`❌ Error: ${res.message}`);
    }
  };

  const getRelayScript = () => {
    switch (scriptType) {
      case 'python':
        return `# ==========================================
# ParsecWake Subnet Relay Daemon (Python 3)
# Run on Raspberry Pi / Linux on target subnet
# ==========================================
import socket
import json
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = 8088

class WolRelayHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            mac_clean = data.get('mac', '').replace(':', '').replace('-', '')
            broadcast_ip = data.get('broadcastIp', '255.255.255.255')
            port = int(data.get('port', 9))
            
            # Construct Magic Packet
            packet = bytes.fromhex('FF' * 6 + mac_clean * 16)
            
            # Broadcast locally on Layer 2
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
            sock.sendto(packet, (broadcast_ip, port))
            sock.close()
            
            print(f"[+] Relayed WoL packet for {mac_clean} to {broadcast_ip}:{port}")
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"success": true, "message": "Magic packet broadcasted on subnet"}')
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(f'{{"success": false, "error": "{str(e)}"}}'.encode())

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', PORT), WolRelayHandler)
    print(f"[*] ParsecWake Relay listening on http://0.0.0.0:{PORT}/wol")
    server.serve_forever()
`;

      case 'docker':
        return `# ==========================================
# Docker Compose: ParsecWake WoL Relay
# ==========================================
version: '3.8'

services:
  wol-relay:
    image: python:3.11-alpine
    container_name: parsecwake-relay
    network_mode: host  # Host network required for L2 UDP Broadcast
    restart: unless-stopped
    command: >
      python3 -c "
      import socket, json
      from http.server import HTTPServer, BaseHTTPRequestHandler
      class H(BaseHTTPRequestHandler):
          def do_POST(self):
              d = json.loads(self.rfile.read(int(self.headers.get('Content-Length', 0))))
              mac = d['mac'].replace(':','').replace('-','')
              s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
              s.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
              s.sendto(bytes.fromhex('FF'*6 + mac*16), (d.get('broadcastIp','255.255.255.255'), int(d.get('port',9))))
              s.close()
              self.send_response(200)
              self.end_headers()
              self.wfile.write(b'{\\\"success\\\":true}')
      HTTPServer(('0.0.0.0', 8088), H).serve_forever()
      "
`;

      case 'node':
        return `// ==========================================
// ParsecWake Micro Relay (Node.js)
// ==========================================
import http from 'http';
import dgram from 'dgram';

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { mac, broadcastIp = '255.255.255.255', port = 9 } = JSON.parse(body);
        const clean = mac.replace(/[^a-fA-F0-9]/g, '');
        const packet = Buffer.concat([
          Buffer.from('FFFFFFFFFFFF', 'hex'),
          ...Array(16).fill(Buffer.from(clean, 'hex'))
        ]);
        const client = dgram.createSocket({ type: 'udp4', reuseAddr: true });
        client.bind(() => {
          client.setBroadcast(true);
          client.send(packet, 0, packet.length, port, broadcastIp, () => client.close());
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  }
});
server.listen(8088, () => console.log('Relay ready on :8088'));
`;

      case 'tailscale':
        return `# ==========================================
# Tailscale Subnet Router (Zero-Port Forwarding)
# ==========================================
# 1. On your 24/7 Home Device (Linux/Pi/PC on subnet 192.168.1.0/24):
sudo tailscale up --advertise-routes=192.168.1.0/24 --accept-routes

# 2. In Tailscale Admin Console (login.tailscale.com):
#    Go to Machines -> Select Device -> Edit Route Settings -> Enable '192.168.1.0/24'

# 3. On your Mobile Phone:
#    Connect Tailscale VPN.
#    You can now send Directed Broadcast directly to 192.168.1.255:9 seamlessly!
`;

      case 'router':
        return `# ==========================================
# Router Setup (OpenWrt / AsusWRT / pfSense)
# ==========================================
# OpenWrt:
opkg update && opkg install etherwake
# Trigger command:
etherwake -b -i br-lan 3C:7C:3F:8A:2B:19

# pfSense / OPNsense:
# Services -> Wake on LAN -> Select interface LAN -> Enter MAC -> Send
# Or configure UDP Broadcast Relay plugin.

# AsusWRT-Merlin:
# Enable IP Directed Broadcast:
nvram set ip_directed_broadcast=1
nvram commit
`;
    }
  };

  const copyScript = () => {
    navigator.clipboard.writeText(getRelayScript());
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="space-y-4 pb-28 max-w-xl mx-auto">
      {/* Subnet Calculator Section */}
      <div className="rounded-3xl bg-[#0f1016] border border-[#ffffff08] p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <Calculator className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Subnet Directed Broadcast Calculator
          </h2>
        </div>
        <p className="text-xs text-gray-400 font-mono">
          Calculate the exact broadcast destination IP needed to route magic packets across VLANs and subnets.
        </p>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">
              Host IP Address
            </label>
            <input
              type="text"
              value={calcIp}
              onChange={(e) => handleCalc(e.target.value, calcMask)}
              placeholder="192.168.1.150"
              className="w-full px-3 py-2 rounded-xl bg-[#1a1b23] border border-[#ffffff10] font-mono text-xs text-white focus:border-indigo-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">
              Subnet Mask / CIDR
            </label>
            <input
              type="text"
              value={calcMask}
              onChange={(e) => handleCalc(calcIp, e.target.value)}
              placeholder="/24 or 255.255.255.0"
              className="w-full px-3 py-2 rounded-xl bg-[#1a1b23] border border-[#ffffff10] font-mono text-xs text-white focus:border-indigo-500/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Calculation Matrix Card */}
        {calcResult && (
          <div className="p-3.5 rounded-2xl bg-[#1a1b23] border border-indigo-500/20 grid grid-cols-2 gap-3 text-xs font-mono shadow-inner">
            <div>
              <span className="text-[10px] text-gray-500 block uppercase tracking-wider">Network IP</span>
              <span className="text-gray-200 font-semibold">{calcResult.networkIp}</span>
            </div>
            <div>
              <span className="text-[10px] text-indigo-400 block uppercase tracking-wider font-bold">
                Broadcast IP (Target)
              </span>
              <span className="text-indigo-300 font-bold">{calcResult.broadcastIp}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 block uppercase tracking-wider">CIDR Bitmask</span>
              <span className="text-gray-300">/{calcResult.cidr}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 block uppercase tracking-wider">Available Hosts</span>
              <span className="text-gray-300">{calcResult.hostCount.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Hex Magic Packet Visualizer */}
      <div className="space-y-3">
        <HexViewer mac={testMac} password={testPassword} />

        {/* Quick Send Packet Sandbox */}
        <div className="rounded-3xl bg-[#0f1016] border border-[#ffffff08] p-5 space-y-3.5 shadow-xl">
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Manual Packet Dispatcher
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">
                Target MAC
              </label>
              <input
                type="text"
                value={testMac}
                onChange={(e) => setTestMac(formatMacAddress(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#1a1b23] border border-[#ffffff10] text-xs font-mono text-white focus:outline-none focus:border-indigo-500/40"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">
                Broadcast Dest IP
              </label>
              <input
                type="text"
                value={testTargetIp}
                onChange={(e) => setTestTargetIp(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#1a1b23] border border-[#ffffff10] text-xs font-mono text-white focus:outline-none focus:border-indigo-500/40"
              />
            </div>
          </div>

          <button
            onClick={handleDispatchTest}
            disabled={sendingTest}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(79,70,229,0.35)] transition-all active:scale-95 disabled:opacity-50 border border-indigo-400/30"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sendingTest ? 'Dispatching...' : 'Dispatch Test Magic Packet'}</span>
          </button>

          {testStatus && (
            <p className="text-xs font-mono text-gray-300 p-2.5 rounded-xl bg-[#1a1b23] border border-[#ffffff10]">
              {testStatus}
            </p>
          )}
        </div>
      </div>

      {/* Subnet Relay Generator */}
      <div className="rounded-3xl bg-[#0f1016] border border-[#ffffff08] p-5 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Subnet Relay Daemon Code
            </h3>
          </div>
          <button
            onClick={copyScript}
            className="flex items-center gap-1.5 text-xs text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 px-3 py-1.5 rounded-xl font-mono transition-colors"
          >
            {copiedScript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedScript ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <p className="text-xs text-gray-400 font-mono">
          Run this micro daemon on any 24/7 device (Raspberry Pi, NAS, Home Assistant) on your target gaming subnet.
        </p>

        {/* Script Type selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'python', label: 'Python 3' },
            { id: 'docker', label: 'Docker' },
            { id: 'node', label: 'Node.js' },
            { id: 'tailscale', label: 'Tailscale' },
            { id: 'router', label: 'Router / OS' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setScriptType(item.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono shrink-0 transition-colors border ${
                scriptType === item.id
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 font-bold'
                  : 'bg-[#1a1b23] text-gray-400 hover:text-gray-200 border-[#ffffff08]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Code Box */}
        <pre className="p-3.5 rounded-2xl bg-[#00000050] border border-[#ffffff08] font-mono text-[10px] text-gray-300 max-h-56 overflow-y-auto select-all leading-relaxed">
          {getRelayScript()}
        </pre>
      </div>
    </div>
  );
};
