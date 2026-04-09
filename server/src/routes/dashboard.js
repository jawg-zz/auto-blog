import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const [
      totalPosts,
      publishedPosts,
      scheduledPosts,
      draftPosts,
      failedPosts,
      totalSources,
      activeSources,
      totalPlatforms,
      activePlatforms,
      totalSchedules,
      activeSchedules,
      recentLogs
    ] = await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: 'published' } }),
      prisma.post.count({ where: { status: 'scheduled' } }),
      prisma.post.count({ where: { status: 'draft' } }),
      prisma.post.count({ where: { status: 'failed' } }),
      prisma.source.count(),
      prisma.source.count({ where: { enabled: true } }),
      prisma.platform.count(),
      prisma.platform.count({ where: { enabled: true } }),
      prisma.schedule.count(),
      prisma.schedule.count({ where: { enabled: true } }),
      prisma.publishingLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          post: { select: { id: true, title: true } },
          platform: { select: { id: true, name: true, type: true } }
        }
      })
    ]);

    const postsByDay = await prisma.post.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const publishingStats = await prisma.publishingLog.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    res.json({
      posts: {
        total: totalPosts,
        published: publishedPosts,
        scheduled: scheduledPosts,
        draft: draftPosts,
        failed: failedPosts
      },
      sources: {
        total: totalSources,
        active: activeSources
      },
      platforms: {
        total: totalPlatforms,
        active: activePlatforms
      },
      schedules: {
        total: totalSchedules,
        active: activeSchedules
      },
      recentActivity: recentLogs,
      publishingStats
    });
  } catch (error) {
    next(error);
  }
});

export default router;
