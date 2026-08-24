import express, { Request, Response } from 'express';
import dgram from 'dgram';
import net from 'net';

export const apiRouter = express.Router();
apiRouter.use(express.json());

// Helper to validate and clean MAC address
function cleanMac(mac: string): string | null {
  const cleaned = mac.replace(/[^a-fA-F0-9]/g, '');
  if (cleaned.length !== 12) return null;
  return cleaned;
}

// Generate WoL Magic Packet Buffer
function createMagicPacketBuffer(macClean: string, secureOnPassword?: string): Buffer {
  const macBytes = Buffer.from(macClean, 'hex');
  const bufferParts: Buffer[] = [];

  // 6 bytes of 0xFF
  bufferParts.push(Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff]));

  // 16 repetitions of MAC
  for (let i = 0; i < 16; i++) {
    bufferParts.push(macBytes);
  }

  // Optional SecureOn password (4 or 6 bytes hex)
  if (secureOnPassword) {
    const cleanPwd = secureOnPassword.replace(/[^a-fA-F0-9]/g, '');
    if (cleanPwd.length === 8 || cleanPwd.length === 12) {
      bufferParts.push(Buffer.from(cleanPwd, 'hex'));
    }
  }

  return Buffer.concat(bufferParts);
}

// Subnet Broadcast Calculator
function calculateBroadcast(ip: string, subnetMask: string): { broadcastIp: string; networkIp: string; hostCount: number } | null {
  const ipParts = ip.trim().split('.').map(Number);
  let maskParts: number[] = [];

  if (subnetMask.startsWith('/')) {
    const cidr = parseInt(subnetMask.replace('/', ''), 10);
    if (isNaN(cidr) || cidr < 0 || cidr > 32) return null;
    const maskNum = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
    maskParts = [
      (maskNum >>> 24) & 255,
      (maskNum >>> 16) & 255,
      (maskNum >>> 8) & 255,
      maskNum & 255,
    ];
  } else {
    maskParts = subnetMask.trim().split('.').map(Number);
  }

  if (ipParts.length !== 4 || maskParts.length !== 4) return null;
  if (ipParts.some(p => isNaN(p) || p < 0 || p > 255)) return null;
  if (maskParts.some(p => isNaN(p) || p < 0 || p > 255)) return null;

  const netParts = ipParts.map((part, i) => part & maskParts[i]);
  const bcastParts = ipParts.map((part, i) => (part & maskParts[i]) | (~maskParts[i] & 255));

  // Count available hosts
  const hostBits = maskParts.reduce((acc, octet) => acc + (8 - octet.toString(2).split('1').length + 1), 0);
  const hostCount = Math.max(0, Math.pow(2, hostBits) - 2);

  return {
    networkIp: netParts.join('.'),
    broadcastIp: bcastParts.join('.'),
    hostCount,
  };
}

// API: Send WoL Magic Packet
apiRouter.post('/wol/send', async (req: Request, res: Response) => {
  try {
    const {
      mac,
      targetIp = '255.255.255.255',
      port = 9,
      secureOnPassword = '',
      subnetMask = '',
      strategy = 'directed_broadcast',
    } = req.body;

    if (!mac) {
      return res.status(400).json({ error: 'MAC address is required.' });
    }

    const clean = cleanMac(mac);
    if (!clean) {
      return res.status(400).json({ error: 'Invalid MAC address. Must contain 12 hex characters.' });
    }

    let destIp = targetIp.trim();

    // If user specified IP and subnet mask, calculate directed broadcast IP
    if (subnetMask && destIp && destIp !== '255.255.255.255') {
      const calc = calculateBroadcast(destIp, subnetMask);
      if (calc) {
        destIp = calc.broadcastIp;
      }
    }

    const packet = createMagicPacketBuffer(clean, secureOnPassword);
    const client = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    let sent = false;
    let errorMsg = '';

    await new Promise<void>((resolve) => {
      client.bind(() => {
        try {
          client.setBroadcast(true);
        } catch (e: any) {
          console.warn('Set broadcast warning:', e?.message);
        }

        const portNum = Number(port) || 9;

        client.send(packet, 0, packet.length, portNum, destIp, (err) => {
          if (err) {
            errorMsg = err.message;
          } else {
            sent = true;
          }
          client.close();
          resolve();
        });
      });
    });

    const hexString = packet.toString('hex').toUpperCase().match(/.{1,2}/g)?.join(' ') || '';

    if (!sent && errorMsg) {
      return res.status(500).json({
        success: false,
        error: errorMsg,
        packetDetails: {
          mac: clean.match(/.{1,2}/g)?.join(':'),
          targetIp: destIp,
          port,
          packetSize: packet.length,
          hexString,
        },
      });
    }

    return res.json({
      success: true,
      message: `WoL Magic Packet successfully dispatched to ${destIp}:${port}`,
      packetDetails: {
        mac: clean.match(/.{1,2}/g)?.join(':'),
        targetIp: destIp,
        port,
        packetSize: packet.length,
        strategy,
        hexString,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to dispatch WoL packet' });
  }
});

// API: Subnet & Broadcast Calculation
apiRouter.post('/network/subnet-calc', (req: Request, res: Response) => {
  const { ip, subnetMask } = req.body;
  if (!ip || !subnetMask) {
    return res.status(400).json({ error: 'Both IP address and Subnet Mask are required.' });
  }

  const result = calculateBroadcast(ip, subnetMask);
  if (!result) {
    return res.status(400).json({ error: 'Invalid IP address or subnet mask format.' });
  }

  return res.json({ success: true, ...result });
});

// API: Ping / Host Port Reachability Check (TCP Port Check for Parsec/RDP/SSH/Sunshine)
apiRouter.post('/devices/ping', async (req: Request, res: Response) => {
  const { host, port = 8000, timeout = 2500 } = req.body;

  if (!host) {
    return res.status(400).json({ error: 'Host is required.' });
  }

  const startTime = Date.now();
  const socket = new net.Socket();
  socket.setTimeout(timeout);

  let isAlive = false;
  let latencyMs = 0;
  let statusMessage = '';

  const checkPromise = new Promise<{ alive: boolean; latency: number; msg: string }>((resolve) => {
    socket.connect(Number(port), host, () => {
      latencyMs = Date.now() - startTime;
      isAlive = true;
      statusMessage = `Port ${port} is OPEN and reachable.`;
      socket.destroy();
      resolve({ alive: true, latency: latencyMs, msg: statusMessage });
    });

    socket.on('error', (err: any) => {
      latencyMs = Date.now() - startTime;
      // In local subnet or cross-subnet, connection refused still means the machine's IP stack is UP!
      if (err.code === 'ECONNREFUSED') {
        isAlive = true;
        statusMessage = `Host IP is UP (Active network stack, port ${port} refused or filtered).`;
      } else {
        isAlive = false;
        statusMessage = `Unreachable (${err.code || err.message}).`;
      }
      socket.destroy();
      resolve({ alive: isAlive, latency: latencyMs, msg: statusMessage });
    });

    socket.on('timeout', () => {
      latencyMs = Date.now() - startTime;
      socket.destroy();
      resolve({ alive: false, latency: latencyMs, msg: `Connection timed out after ${timeout}ms.` });
    });
  });

  const result = await checkPromise;

  return res.json({
    host,
    port,
    isOnline: result.alive,
    latencyMs: result.latency,
    statusMessage: result.msg,
    timestamp: new Date().toISOString(),
  });
});
