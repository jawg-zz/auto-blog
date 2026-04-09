import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { validate, schemas } from '../middleware/validate.js';
import { logger } from '../utils/logger.js';
import { authenticate } from '../middleware/auth.js';
import { rssService } from '../services/sources/rss.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const sources = await prisma.source.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(sources);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const source = await prisma.source.findUnique({
      where: { id: req.params.id }
    });
    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }
    res.json(source);
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, validate(schemas.source), async (req, res, next) => {
  try {
    const source = await prisma.source.create({
      data: req.body
    });
    logger.info(`Source created: ${source.id}`);
    res.status(201).json(source);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, validate(schemas.source), async (req, res, next) => {
  try {
    const source = await prisma.source.update({
      where: { id: req.params.id },
      data: req.body
    });
    logger.info(`Source updated: ${source.id}`);
    res.json(source);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await prisma.source.delete({
      where: { id: req.params.id }
    });
    logger.info(`Source deleted: ${req.params.id}`);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post('/:id/test', authenticate, async (req, res, next) => {
  try {
    const source = await prisma.source.findUnique({
      where: { id: req.params.id }
    });

    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    if (source.type === 'rss') {
      const result = await rssService.fetchFeed(source.config.url);
      res.json({ success: true, items: result.items?.length || 0 });
    } else {
      res.json({ success: true, message: 'Source type does not require testing' });
    }
  } catch (error) {
    logger.error('Source test failed:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
