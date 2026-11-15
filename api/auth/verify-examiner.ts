import crypto from 'crypto';

const DEFAULT_COACH_HASH = 'c2d3c486c1639485f888cd091f26fe880997ee26d7da1606e201da1e50030b9b';
const DEFAULT_EXAMINER_HASH = '63b5a875810c220bd1fb892aa160dae94ed508e23a54fefd89026a813f0f6208';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const attempts = new Map<string, { count: number; resetAt: number }>();

function isRealSecret(val: string | undefined): val is string {
  if (!val) return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  if (/^(SET_|MY_|REPLACE_|CHANGE_|YOUR_|<)/i.test(trimmed)) return false;
  return true;
}

function getSessionSecret(): string {
  if (isRealSecret(process.env.SESSION_SECRET)) {
    return process.env.SESSION_SECRET.trim();
  }
  return crypto
    .createHmac('sha256', 'lkcp-vercel-session-derive')
    .update(DEFAULT_COACH_HASH + DEFAULT_EXAMINER_HASH)
    .digest('hex');
}

function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function timingSafeHexCompare(aHex: string, bHex: string): boolean {
  const aBuf = Buffer.from(aHex, 'hex');
  const bBuf = Buffer.from(bHex, 'hex');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function getExpectedExaminerHash(): string {
  if (isRealSecret(process.env.EXAMINER_PASSCODE)) {
    return sha256Hex(process.env.EXAMINER_PASSCODE.trim().toUpperCase());
  }
  return DEFAULT_EXAMINER_HASH;
}

function signSessionToken(payload: { role: 'coach' | 'examiner'; name?: string; iat: number; exp: number }): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ authenticated: false, error: 'Method not allowed' });
  }

  const ip = String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && now <= entry.resetAt && entry.count >= 25) {
    return res.status(429).json({
      authenticated: false,
      error: 'Too many failed attempts. Please try again later.'
    });
  }

  let body: any = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch {
    body = {};
  }

  const examinerName = typeof body?.name === 'string' ? body.name.trim().slice(0, 80) : '';
  if (!examinerName) {
    return res.status(400).json({
      authenticated: false,
      error: 'Please enter the Examiner / Sensei Name.'
    });
  }

  const rawPasscode = typeof body?.passcode === 'string' ? body.passcode.trim().toUpperCase() : '';
  if (!rawPasscode || rawPasscode.length > 64 || !timingSafeHexCompare(sha256Hex(rawPasscode), getExpectedExaminerHash())) {
    if (!entry || now > entry.resetAt) {
      attempts.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
    } else {
      entry.count += 1;
    }
    return res.status(401).json({
      authenticated: false,
      error: 'Incorrect Examiner Access Password. Access denied.'
    });
  }

  attempts.delete(ip);
  const token = signSessionToken({
    role: 'examiner',
    name: examinerName,
    iat: now,
    exp: now + SESSION_TTL_MS
  });

  return res.status(200).json({
    authenticated: true,
    role: 'examiner',
    name: examinerName,
    token,
    expiresAt: now + SESSION_TTL_MS
  });
}
