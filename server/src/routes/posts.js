import { Router } from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { logger } from '../utils/logger.js';
import { authenticate } from '../middleware/auth.js';
import { getQueue } from '../services/queue.js';
import { prisma } from '../utils/db.js';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, sourceId, categoryId, limit = 50, offset = 0 } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (sourceId) where.sourceId = sourceId;
    if (categoryId) where.categoryId = categoryId;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          source: { select: { id: true, name: true, type: true } },
          category: { select: { id: true, name: true, slug: true } },
          tags: { include: { tag: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.post.count({ where })
    ]);

    res.json({ posts, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: {
        source: true,
        category: true,
        tags: { include: { tag: true } },
        publishingLogs: { include: { platform: true }, orderBy: { createdAt: 'desc' } }
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, validate(schemas.post), async (req, res, next) => {
  try {
    const { tagIds, ...data } = req.body;
    
    const post = await prisma.post.create({
      data: {
        ...data,
        tags: tagIds ? { create: tagIds.map(tagId => ({ tagId })) } : undefined
      },
      include: {
        category: true,
        tags: { include: { tag: true } }
      }
    });

    logger.info(`Post created: ${post.id}`);
    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, validate(schemas.post), async (req, res, next) => {
  try {
    const { tagIds, ...data } = req.body;

    const existingPost = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: { tags: true }
    });

    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await prisma.postTag.deleteMany({
      where: { postId: req.params.id }
    });

    const post = await prisma.post.update({
      where: { id: req.params.id },
      data: {
        ...data,
        tags: tagIds ? { create: tagIds.map(tagId => ({ tagId })) } : undefined
      },
      include: {
        category: true,
        tags: { include: { tag: true } }
      }
    });

    logger.info(`Post updated: ${post.id}`);
    res.json(post);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await prisma.post.delete({
      where: { id: req.params.id }
    });
    logger.info(`Post deleted: ${req.params.id}`);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post('/:id/publish', authenticate, async (req, res, next) => {
  try {
    const { platformIds } = req.body;
    const post = await prisma.post.findUnique({
      where: { id: req.params.id }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const queue = getQueue('publishing');
    
    await Promise.all(platformIds.map(platformId => queue.add('publish-post', {
      postId: post.id,
      platformId,
      attempts: 3
    })));

    res.json({ success: true, message: `Queued for publishing to ${platformIds.length} platform(s)` });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/retry', authenticate, async (req, res, next) => {
  try {
    const failedLogs = await prisma.publishingLog.findMany({
      where: { postId: req.params.id, status: 'failed' }
    });

    if (failedLogs.length === 0) {
      return res.status(400).json({ error: 'No failed publishing attempts to retry' });
    }

    const queue = getQueue('publishing');
    
    await Promise.all(failedLogs.map(log => queue.add('publish-post', {
      postId: req.params.id,
      platformId: log.platformId,
      attempts: 3,
      isRetry: true
    })));

    res.json({ success: true, message: `Retry queued for ${failedLogs.length} platform(s)` });
  } catch (error) {
    next(error);
  }
});

export default router;
