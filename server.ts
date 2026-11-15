import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

// Basic security headers compatible with iframe previews
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Server-side SHA-256 digests (no plaintext passcodes stored in source code)
const DEFAULT_COACH_HASH = 'c2d3c486c1639485f888cd091f26fe880997ee26d7da1606e201da1e50030b9b';
const DEFAULT_EXAMINER_HASH = '63b5a875810c220bd1fb892aa160dae94ed508e23a54fefd89026a813f0f6208';

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  crypto.randomBytes(32).toString('hex');

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

// In-memory brute-force rate limiter per IP + scope
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 25;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function getClientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) {
    return fwd.split(',')[0].trim();
  }
  return req.ip || 'unknown';
}

function checkRateLimit(key: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    return { allowed: true };
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((entry.resetAt - now) / 1000)
    };
  }
  return { allowed: true };
}

function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

function clearAttempts(key: string): void {
  loginAttempts.delete(key);
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

function isRealSecret(val: string | undefined): val is string {
  if (!val) return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  if (/^(SET_|MY_|REPLACE_|CHANGE_|YOUR_|<)/i.test(trimmed)) return false;
  return true;
}

function getExpectedCoachHash(): string {
  const envPass = process.env.COACH_PASSCODE;
  if (isRealSecret(envPass)) return sha256Hex(envPass.trim().toUpperCase());
  return DEFAULT_COACH_HASH;
}

function getExpectedExaminerHash(): string {
  const envPass = process.env.EXAMINER_PASSCODE;
  if (isRealSecret(envPass)) return sha256Hex(envPass.trim().toUpperCase());
  return DEFAULT_EXAMINER_HASH;
}

interface TokenPayload {
  role: 'coach' | 'examiner';
  name?: string;
  iat: number;
  exp: number;
}

function signSessionToken(payload: TokenPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

function verifySessionToken(token: string): TokenPayload | null {
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

// POST /api/auth/verify-coach
app.post('/api/auth/verify-coach', (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const rateKey = `coach:${ip}`;
  const rate = checkRateLimit(rateKey);
  if (!rate.allowed) {
    return res.status(429).json({
      authenticated: false,
      error: `Too many failed attempts. Please wait ${Math.ceil((rate.retryAfterSec || 60) / 60)} minutes before retrying.`
    });
  }

  const rawPasscode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim().toUpperCase() : '';
  if (!rawPasscode || rawPasscode.length > 64) {
    recordFailedAttempt(rateKey);
    return res.status(401).json({
      authenticated: false,
      error: 'Invalid passcode. Access denied.'
    });
  }

  const providedHash = sha256Hex(rawPasscode);
  const expectedHash = getExpectedCoachHash();

  if (!timingSafeHexCompare(providedHash, expectedHash)) {
    recordFailedAttempt(rateKey);
    return res.status(401).json({
      authenticated: false,
      error: 'Invalid passcode. Access denied.'
    });
  }

  clearAttempts(rateKey);
  const now = Date.now();
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
});

// POST /api/auth/verify-examiner
app.post('/api/auth/verify-examiner', (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const rateKey = `examiner:${ip}`;
  const rate = checkRateLimit(rateKey);
  if (!rate.allowed) {
    return res.status(429).json({
      authenticated: false,
      error: `Too many failed attempts. Please wait ${Math.ceil((rate.retryAfterSec || 60) / 60)} minutes before retrying.`
    });
  }

  const rawPasscode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim().toUpperCase() : '';
  const examinerName = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 80) : '';

  if (!examinerName) {
    return res.status(400).json({
      authenticated: false,
      error: 'Please enter the Examiner / Sensei Name.'
    });
  }

  if (!rawPasscode || rawPasscode.length > 64) {
    recordFailedAttempt(rateKey);
    return res.status(401).json({
      authenticated: false,
      error: 'Incorrect Examiner Access Password. Access denied.'
    });
  }

  const providedHash = sha256Hex(rawPasscode);
  const expectedHash = getExpectedExaminerHash();

  if (!timingSafeHexCompare(providedHash, expectedHash)) {
    recordFailedAttempt(rateKey);
    return res.status(401).json({
      authenticated: false,
      error: 'Incorrect Examiner Access Password. Access denied.'
    });
  }

  clearAttempts(rateKey);
  const now = Date.now();
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
});

// GET /api/auth/session
app.get('/api/auth/session', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || '';
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
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
