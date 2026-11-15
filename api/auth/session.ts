import { verifySessionToken } from '../_security';

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
