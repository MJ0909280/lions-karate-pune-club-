import {
  sha256Hex,
  timingSafeHexCompare,
  getExpectedExaminerHash,
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
