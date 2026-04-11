import Bull from 'bull';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const queues = {};

export async function initQueue() {
  queues.publishing = new Bull('publishing', config.redis.url, {
    defaultJobOptions: {
      attempts: config.queue.attempts,
      backoff: config.queue.backoff,
      timeout: config.queue.timeout,
      removeOnComplete: false
    }
  });

  queues.scheduling = new Bull('scheduling', config.redis.url, {
    defaultJobOptions: {
      attempts: config.queue.attempts,
      backoff: config.queue.backoff,
      timeout: config.queue.timeout,
      removeOnComplete: false
    }
  });

  queues.content = new Bull('content', config.redis.url, {
    defaultJobOptions: {
      attempts: config.queue.attempts,
      backoff: config.queue.backoff,
      timeout: config.queue.timeout,
      removeOnComplete: false
    }
  });

  setupQueueEvents(queues.publishing, 'publishing');
  setupQueueEvents(queues.scheduling, 'scheduling');
  setupQueueEvents(queues.content, 'content');

  await cleanStaleJobs();
  logger.info('Bull queues initialized');
}

function setupQueueEvents(queue, name) {
  queue.on('error', (error) => {
    logger.error(`${name} queue error:`, error);
  });

  queue.on('failed', (job, error) => {
    logger.error(`${name} job ${job.id} failed:`, error.message);
  });

  queue.on('completed', (job) => {
    logger.info(`${name} job ${job.id} completed`);
  });

  queue.on('progress', (job, progress) => {
    logger.debug(`${name} job ${job.id} progress: ${progress}%`);
  });
}

export function getQueue(name) {
  if (!queues[name]) {
    throw new Error(`Queue ${name} not found`);
  }
  return queues[name];
}

export async function cleanStaleJobs() {
  const now = Date.now();
  for (const [name, queue] of Object.entries(queues)) {
    try {
      // Remove jobs stuck in 'active' state from a force-killed previous instance
      const stalled = await queue.clean(1000, 'active');
      if (stalled.length > 0) {
        logger.info(`Cleaned ${stalled.length} stale active ${name} jobs`);
      }
      // Also clean old failed jobs
      const failed = await queue.clean(now - 7 * 24 * 60 * 60 * 1000, 'failed');
      if (failed.length > 0) {
        logger.info(`Cleaned ${failed.length} stale failed ${name} jobs`);
      }
    } catch (error) {
      logger.warn(`Failed to clean stale ${name} jobs:`, error.message);
    }
  }
}

export async function closeQueues() {
  for (const [name, queue] of Object.entries(queues)) {
    await queue.close();
    logger.info(`${name} queue closed`);
  }
}
