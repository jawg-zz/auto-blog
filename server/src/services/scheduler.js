import cron from 'node-cron';
import { CronExpressionParser } from 'cron-parser';
import { logger } from '../utils/logger.js';
import { getQueue } from './queue.js';
import { prisma } from '../utils/db.js';

let scheduledTasks = [];
let isReloading = false;

export function initScheduler() {
  scheduleHealthCheck();
  scheduleLogCleanup();
  loadSchedulesFromDb();
  
  cron.schedule('*/5 * * * *', loadSchedulesFromDb);
  
  logger.info('Cron scheduler initialized');
}

async function loadSchedulesFromDb() {
  if (isReloading) return;
  isReloading = true;
  
  try {
    const schedules = await prisma.schedule.findMany({
      where: { enabled: true },
      include: { source: true }
    });

    for (const task of scheduledTasks) {
      task.task.stop();
    }
    scheduledTasks = [];

    for (const schedule of schedules) {
      try {
        const task = cron.schedule(schedule.cronExpression, async () => {
          await triggerSchedule(schedule);
        }, {
          scheduled: true
        });

        scheduledTasks.push({
          id: schedule.id,
          task
        });

        logger.info(`Schedule loaded: ${schedule.name} (${schedule.cronExpression})`);
      } catch (e) {
        logger.error(`Invalid cron for schedule ${schedule.id}: ${schedule.cronExpression}`);
        // Optionally disable: await prisma.schedule.update({ where: { id: schedule.id }, data: { enabled: false } });
      }
    }

    logger.info(`Loaded ${scheduledTasks.length} schedules`);
  } catch (error) {
    logger.error('Failed to load schedules:', error);
  } finally {
    isReloading = false;
  }
}

async function triggerSchedule(schedule) {
  try {
    logger.info(`Triggering schedule: ${schedule.name}`);

    const queue = getQueue('scheduling');
    await queue.add('run-schedule', {
      scheduleId: schedule.id,
      sourceId: schedule.sourceId,
      platformIds: schedule.platformIds
    });

    const interval = CronExpressionParser.parse(schedule.cronExpression);
    const nextRun = interval.next().toDate();
    await prisma.schedule.update({
      where: { id: schedule.id },
      data: {
        lastRun: new Date(),
        nextRun
      }
    });

    logger.info(`Schedule triggered: ${schedule.name}`);
  } catch (error) {
    logger.error(`Failed to trigger schedule ${schedule.name}:`, error);
  }
}

function scheduleHealthCheck() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      logger.debug('Health check: Database connection OK');
    } catch (error) {
      logger.error('Health check failed:', error);
    }
  });
}

function scheduleLogCleanup() {
  cron.schedule('0 0 * * *', async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const result = await prisma.publishingLog.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
          status: { not: 'failed' }
        }
      });

      logger.info(`Log cleanup: Removed ${result.count} old logs`);
    } catch (error) {
      logger.error('Log cleanup failed:', error);
    }
  });
}

export function stopScheduler() {
  for (const { task } of scheduledTasks) {
    task.stop();
  }
  scheduledTasks = [];
  logger.info('Scheduler stopped');
}