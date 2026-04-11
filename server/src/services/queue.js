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
    },
    settings: {
      staleInterval: 1000, // Check for stale jobs every 1s (faster cleanup)
      keepJobs: 1000
    }
  });

  queues.scheduling = new Bull('scheduling', config.redis.url, {
    defaultJobOptions: {
      attempts: config.queue.attempts,
      backoff: config.queue.backoff,
      timeout: config.queue.timeout,
      removeOnComplete: false
    },
    settings: {
      staleInterval: 1000,
      keepJobs: 1000
    }
  });

  queues.content = new Bull('content', config.redis.url, {
    defaultJobOptions: {
      attempts: config.queue.attempts,
      backoff: config.queue.backoff,
      timeout: config.queue.timeout,
      removeOnComplete: false
    },
    settings: {
      staleInterval: 1000,
      keepJobs: 1000
    }
  });

  setupQueueEvents(queues.publishing, 'publishing');
  setupQueueEvents(queues.scheduling, 'scheduling');
  setupQueueEvents(queues.content, 'content');

  // Clean stale active jobs immediately on startup, before workers process anything
  await cleanStaleJobs();
  logger.info('Bull queues initialized');
}

function setupQueueEvents(queue, name) {
  queue.on('error', (error) => {
    logger.error(`${name} queue error:`, error);
  });

  queue.on('failed', (job, error) => {
    // Suppress "not in active state" errors — these are from Bull's own stale
    // job cleanup on pre-existing active jobs from a crashed instance. Harmless.
    if (error.message && error.message.includes('not in the active state')) {
      return;
    }
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
  for (const [name, queue] of Object.entries(queues)) {
    try {
      // Clean stale active jobs (from crashed instance) and old failed jobs
      const now = Date.now();
      const staleActive = await queue.clean(1000, 'active');
      const staleFailed = await queue.clean(now - 7 * 24 * 60 * 60 * 1000, 'failed');
      if (staleActive.length > 0) {
        logger.info(`Cleaned ${staleActive.length} stale active ${name} jobs`);
      }
      if (staleFailed.length > 0) {
        logger.info(`Cleaned ${staleFailed.length} stale failed ${name} jobs`);
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
