import { createHmac, timingSafeEqual } from 'crypto';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

function verifyJwt(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');

  const [encodedHeader, encodedPayload, providedSig] = parts;

  // Verify signature
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSig = createHmac('sha256', Buffer.from(secret, 'utf8'))
    .update(signatureInput)
    .digest('base64url');

  // Timing-safe comparison
  const a = Buffer.from(expectedSig, 'utf8');
  const b = Buffer.from(providedSig, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error('Invalid signature');
  }

  // Decode and verify payload
  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return payload;
}

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyJwt(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Invalid token attempt:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyJwt(token, config.jwt.secret);
    req.user = decoded;
  } catch (error) {
    // Token invalid, but that's okay for optional auth
  }

  next();
};
