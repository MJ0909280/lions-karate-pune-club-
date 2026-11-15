import crypto from 'crypto';

const DEFAULT_COACH_HASH = 'c2d3c486c1639485f888cd091f26fe880997ee26d7da1606e201da1e50030b9b';
const DEFAULT_EXAMINER_HASH = '63b5a875810c220bd1fb892aa160dae94ed508e23a54fefd89026a813f0f6208';

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

function verifySessionToken(token: string) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, providedSig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('base64url');

  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!parsed || typeof parsed.exp !== 'number' || Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export default function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ authenticated: false });
  }

  const authHeader = String(req.headers?.authorization || '');
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const payload = verifySessionToken(token);

  if (!payload) {
    return res.status(401).json({ authenticated: false });
  }

  return res.status(200).json({
    authenticated: true,
    role: payload.role,
    name: payload.name || null,
    expiresAt: payload.exp
  });
}
