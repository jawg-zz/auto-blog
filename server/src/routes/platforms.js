import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { validate, schemas } from '../middleware/validate.js';
import { logger } from '../utils/logger.js';
import { authenticate } from '../middleware/auth.js';
import { maskSensitiveData } from '../utils/helpers.js';
import { testWordPressConnection } from '../services/publishers/wordpress.js';
import { testGhostConnection } from '../services/publishers/ghost.js';
import { testMediumConnection } from '../services/publishers/medium.js';
import { testCustomApiConnection } from '../services/publishers/custom.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const platforms = await prisma.platform.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const masked = platforms.map(p => ({
      ...p,
      credentials: maskSensitiveData(p.credentials)
    }));

    res.json(masked);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const platform = await prisma.platform.findUnique({
      where: { id: req.params.id }
    });

    if (!platform) {
      return res.status(404).json({ error: 'Platform not found' });
    }

    res.json({
      ...platform,
      credentials: maskSensitiveData(platform.credentials)
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, validate(schemas.platform), async (req, res, next) => {
  try {
    const platform = await prisma.platform.create({
      data: req.body
    });
    logger.info(`Platform created: ${platform.id}`);
    res.status(201).json(platform);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, validate(schemas.platform), async (req, res, next) => {
  try {
    const platform = await prisma.platform.update({
      where: { id: req.params.id },
      data: req.body
    });
    logger.info(`Platform updated: ${platform.id}`);
    res.json(platform);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await prisma.platform.delete({
      where: { id: req.params.id }
    });
    logger.info(`Platform deleted: ${req.params.id}`);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post('/:id/test', authenticate, async (req, res, next) => {
  try {
    const platform = await prisma.platform.findUnique({
      where: { id: req.params.id }
    });

    if (!platform) {
      return res.status(404).json({ error: 'Platform not found' });
    }

    let result;
    switch (platform.type) {
      case 'wordpress':
        result = await testWordPressConnection(platform.credentials);
        break;
      case 'ghost':
        result = await testGhostConnection(platform.credentials);
        break;
      case 'medium':
        result = await testMediumConnection(platform.credentials);
        break;
      case 'custom_api':
        result = await testCustomApiConnection(platform.credentials);
        break;
      default:
        return res.status(400).json({ error: 'Unknown platform type' });
    }

    res.json(result);
  } catch (error) {
    logger.error('Platform test failed:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
