import crypto from 'crypto';

const DEFAULT_COACH_HASH = 'c2d3c486c1639485f888cd091f26fe880997ee26d7da1606e201da1e50030b9b';
const DEFAULT_EXAMINER_HASH = '63b5a875810c220bd1fb892aa160dae94ed508e23a54fefd89026a813f0f6208';

// Note: On serverless deployments, configure SESSION_SECRET env var for cross-instance continuity
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  crypto.createHmac('sha256', 'lkcp-vercel-session-derive').update(DEFAULT_COACH_HASH + DEFAULT_EXAMINER_HASH).digest('hex');

export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export interface TokenPayload {
  role: 'coach' | 'examiner';
  name?: string;
  iat: number;
  exp: number;
}

export function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function timingSafeHexCompare(aHex: string, bHex: string): boolean {
  const aBuf = Buffer.from(aHex, 'hex');
  const bBuf = Buffer.from(bHex, 'hex');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export function getExpectedCoachHash(): string {
  const envPass = process.env.COACH_PASSCODE?.trim();
  if (envPass) return sha256Hex(envPass.toUpperCase());
  return DEFAULT_COACH_HASH;
}

export function getExpectedExaminerHash(): string {
  const envPass = process.env.EXAMINER_PASSCODE?.trim();
  if (envPass) return sha256Hex(envPass.toUpperCase());
  return DEFAULT_EXAMINER_HASH;
}

export function signSessionToken(payload: TokenPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string): TokenPayload | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, providedSig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');

  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as TokenPayload;
    if (!parsed || typeof parsed.exp !== 'number' || Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
