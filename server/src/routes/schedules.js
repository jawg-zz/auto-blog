import { Router } from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { logger } from '../utils/logger.js';
import { authenticate } from '../middleware/auth.js';
import { getQueue } from '../services/queue.js';
import { CronExpressionParser } from 'cron-parser';
import { prisma } from '../utils/db.js';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const schedules = await prisma.schedule.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        source: { select: { id: true, name: true, type: true } }
      }
    });
    res.json(schedules);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: req.params.id },
      include: {
        source: true
      }
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json(schedule);
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, validate(schemas.schedule), async (req, res, next) => {
  try {
    const { cronExpression, platformIds } = req.body;

    try {
      CronExpressionParser.parse(cronExpression);
    } catch (e) {
      console.error('[CRON PARSE ERROR]', cronExpression, e.message);
      return res.status(400).json({ error: `Invalid cron expression: ${e.message}` });
    }

    if (platformIds && platformIds.length > 0) {
      const platforms = await prisma.platform.findMany({
        where: { id: { in: platformIds } },
        select: { id: true }
      });
      const validIds = new Set(platforms.map(p => p.id));
      const invalidIds = platformIds.filter(id => !validIds.has(id));
      if (invalidIds.length > 0) {
        return res.status(400).json({ error: `Invalid platformIds: ${invalidIds.join(', ')}` });
      }
    }

    const nextRun = getNextCronRun(cronExpression);

    const schedule = await prisma.schedule.create({
      data: {
        ...req.body,
        nextRun
      },
      include: {
        source: true
      }
    });

    logger.info(`Schedule created: ${schedule.id}`);
    res.status(201).json(schedule);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, validate(schemas.schedule), async (req, res, next) => {
  try {
    const { cronExpression, platformIds } = req.body;

    try {
      CronExpressionParser.parse(cronExpression);
    } catch (e) {
      console.error('[CRON PARSE ERROR]', cronExpression, e.message);
      return res.status(400).json({ error: `Invalid cron expression: ${e.message}` });
    }

    if (platformIds && platformIds.length > 0) {
      const platforms = await prisma.platform.findMany({
        where: { id: { in: platformIds } },
        select: { id: true }
      });
      const validIds = new Set(platforms.map(p => p.id));
      const invalidIds = platformIds.filter(id => !validIds.has(id));
      if (invalidIds.length > 0) {
        return res.status(400).json({ error: `Invalid platformIds: ${invalidIds.join(', ')}` });
      }
    }

    const nextRun = getNextCronRun(cronExpression);

    const schedule = await prisma.schedule.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        nextRun
      },
      include: {
        source: true
      }
    });

    logger.info(`Schedule updated: ${schedule.id}`);
    res.json(schedule);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await prisma.schedule.delete({
      where: { id: req.params.id }
    });
    logger.info(`Schedule deleted: ${req.params.id}`);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post('/:id/trigger', authenticate, async (req, res, next) => {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: req.params.id },
      include: { source: true }
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const queue = getQueue('scheduling');
    await queue.add('run-schedule', {
      scheduleId: schedule.id,
      sourceId: schedule.sourceId,
      platformIds: schedule.platformIds
    });

    res.json({ success: true, message: 'Schedule triggered manually' });
  } catch (error) {
    next(error);
  }
});

function getNextCronRun(cronExpression) {
  const interval = CronExpressionParser.parse(cronExpression);
  return interval.next().toDate();
}

export default router;
