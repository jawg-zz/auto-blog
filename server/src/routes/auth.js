import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { createHmac } from 'crypto';
import { validate, schemas } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../utils/db.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts, please try again later.' }
});

function signJwt(payload, secret, expiresIn) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac('sha256', Buffer.from(secret, 'utf8'))
    .update(signatureInput)
    .digest('base64url');
  return `${signatureInput}.${signature}`;
}

router.post('/register', authRateLimiter, validate(schemas.register), async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    });

    const token = signJwt(
      { id: user.id, email: user.email },
      config.jwt.secret,
      config.jwt.expiresIn
    );

    logger.info(`User registered: ${user.email}`);

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', authRateLimiter, validate(schemas.login), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signJwt(
      { id: user.id, email: user.email },
      config.jwt.secret,
      config.jwt.expiresIn
    );

    logger.info(`User logged in: ${user.email}`);

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

export default router;
