import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { validate, schemas } from '../middleware/validate.js';
import { logger } from '../utils/logger.js';
import { authenticate } from '../middleware/auth.js';
import { getQueue } from '../services/queue.js';
import pkg from 'cron-parser';
const { validateCronExpression } = pkg;

const router = Router();
const prisma = new PrismaClient();

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
    const { cronExpression } = req.body;

    try {
      validateCronExpression(cronExpression);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid cron expression' });
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
    const { cronExpression } = req.body;

    try {
      validateCronExpression(cronExpression);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid cron expression' });
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
  const cron = cronExpression.split(' ');
  const now = new Date();
  
  let minute = cron[0];
  let hour = cron[1];
  let dayOfMonth = cron[2];
  let month = cron[3];
  let dayOfWeek = cron[4];

  if (minute === '*') minute = now.getMinutes();
  if (hour === '*') hour = now.getHours();
  
  const next = new Date(now);
  next.setMinutes(parseInt(minute) || 0);
  next.setHours(parseInt(hour) || 0);
  
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

export default router;
