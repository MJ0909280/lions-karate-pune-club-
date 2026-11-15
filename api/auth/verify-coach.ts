import {
  sha256Hex,
  timingSafeHexCompare,
  getExpectedCoachHash,
  signSessionToken,
  SESSION_TTL_MS
} from '../_security';

const attempts = new Map<string, { count: number; resetAt: number }>();

export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ authenticated: false, error: 'Method not allowed' });
  }

  const ip = String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && now <= entry.resetAt && entry.count >= 8) {
    return res.status(429).json({
      authenticated: false,
      error: 'Too many failed attempts. Please try again later.'
    });
  }

  const rawPasscode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim().toUpperCase() : '';
  if (!rawPasscode || rawPasscode.length > 64 || !timingSafeHexCompare(sha256Hex(rawPasscode), getExpectedCoachHash())) {
    if (!entry || now > entry.resetAt) {
      attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    } else {
      entry.count += 1;
    }
    return res.status(401).json({
      authenticated: false,
      error: 'Invalid passcode. Access denied.'
    });
  }

  attempts.delete(ip);
  const token = signSessionToken({
    role: 'coach',
    iat: now,
    exp: now + SESSION_TTL_MS
  });

  return res.status(200).json({
    authenticated: true,
    role: 'coach',
    token,
    expiresAt: now + SESSION_TTL_MS
  });
}
