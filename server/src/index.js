import app from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { initQueue } from './services/queue.js';
import { initScheduler } from './services/scheduler.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function startServer() {
  try {
    await prisma.$connect;
    logger.info('Database connected successfully');

    await initQueue();
    logger.info('Queue system initialized');

    await import('./workers/index.js').then(({ initWorkers }) => initWorkers());

    initScheduler();
    logger.info('Scheduler initialized');

    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
