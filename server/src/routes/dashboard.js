import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../utils/db.js';

const router = Router();

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

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const postsLastWeek = await prisma.post.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo }
      },
      select: { createdAt: true }
    });

    const postsByDayMap = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      postsByDayMap[key] = 0;
    }

    for (const post of postsLastWeek) {
      const key = post.createdAt.toISOString().split('T')[0];
      if (postsByDayMap[key] !== undefined) {
        postsByDayMap[key]++;
      }
    }

    const postsByDay = Object.entries(postsByDayMap).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => a.date.localeCompare(b.date));

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
