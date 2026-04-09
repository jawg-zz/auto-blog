import { PrismaClient } from '@prisma/client';
import { getQueue } from '../services/queue.js';
import { logger } from '../utils/logger.js';
import { WordPressPublisher } from '../services/publishers/wordpress.js';
import { GhostPublisher } from '../services/publishers/ghost.js';
import { MediumPublisher } from '../services/publishers/medium.js';
import { CustomApiPublisher } from '../services/publishers/custom.js';
import { RssSource } from '../services/sources/rss.js';
import { AiSource } from '../services/sources/ai.js';
import { fetchRssFeed } from '../services/sources/rss.js';

const prisma = new PrismaClient();

export function initWorkers() {
  const publishingQueue = getQueue('publishing');
  const schedulingQueue = getQueue('scheduling');
  const contentQueue = getQueue('content');

  publishingQueue.process('publish-post', 5, async (job) => {
    const { postId, platformId } = job.data;
    
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { category: true, tags: { include: { tag: true } } }
    });

    const platform = await prisma.platform.findUnique({
      where: { id: platformId }
    });

    if (!post || !platform) {
      throw new Error('Post or platform not found');
    }

    let publisher;
    switch (platform.type) {
      case 'wordpress':
        publisher = new WordPressPublisher(platform.credentials);
        break;
      case 'ghost':
        publisher = new GhostPublisher(platform.credentials);
        break;
      case 'medium':
        publisher = new MediumPublisher(platform.credentials);
        break;
      case 'custom_api':
        publisher = new CustomApiPublisher(platform.credentials);
        break;
      default:
        throw new Error(`Unknown platform type: ${platform.type}`);
    }

    const postData = {
      ...post,
      categories: post.category ? [post.category.name] : [],
      tags: post.tags.map(t => t.tag.name)
    };

    const result = await publisher.publish(postData);

    await prisma.publishingLog.create({
      data: {
        postId,
        platformId,
        status: 'success',
        response: result,
        publishedUrl: result.url,
        attempts: job.attemptsMade + 1
      }
    });

    await prisma.post.update({
      where: { id: postId },
      data: { 
        status: 'published',
        publishedAt: new Date()
      }
    });

    logger.info(`Post ${postId} published to ${platform.name}: ${result.url}`);

    return result;
  });

  publishingQueue.process('retry-failed', 3, async (job) => {
    const { postId, platformId } = job.data;
    
    await prisma.publishingLog.updateMany({
      where: { postId, platformId, status: 'failed' },
      data: { status: 'retrying' }
    });

    const publishingJob = await publishingQueue.add('publish-post', {
      postId,
      platformId
    });

    return { retryJobId: publishingJob.id };
  });

  schedulingQueue.process('run-schedule', async (job) => {
    const { scheduleId, sourceId, platformIds } = job.data;

    const source = await prisma.source.findUnique({
      where: { id: sourceId }
    });

    if (!source) {
      throw new Error('Source not found');
    }

    let items = [];
    if (source.type === 'rss') {
      const feed = await fetchRssFeed(source.config.url);
      items = feed.items;
    } else if (source.type === 'ai_generation') {
      const aiSource = new AiSource(source.config);
      items = await aiSource.fetch();
    }

    for (const item of items) {
      const post = await prisma.post.create({
        data: {
          title: item.title,
          content: item.content,
          excerpt: item.excerpt || null,
          sourceId: source.id,
          status: 'draft'
        }
      });

      for (const platformId of platformIds) {
        await publishingQueue.add('publish-post', {
          postId: post.id,
          platformId
        });
      }
    }

    logger.info(`Schedule ${scheduleId} completed: Processed ${items.length} items`);

    return { processed: items.length };
  });

  contentQueue.process('process-rss', async (job) => {
    const { sourceId, url } = job.data;

    const feed = await fetchRssFeed(url);
    
    logger.info(`RSS processing complete: ${feed.items.length} items from ${url}`);

    return feed;
  });

  contentQueue.process('generate-ai', async (job) => {
    const { sourceId, config } = job.data;

    const aiSource = new AiSource(config);
    const items = await aiSource.fetch();

    for (const item of items) {
      await prisma.post.create({
        data: {
          title: item.title,
          content: item.content,
          excerpt: item.excerpt,
          sourceId,
          status: 'draft'
        }
      });
    }

    return { generated: items.length };
  });

  logger.info('Workers initialized and processing jobs');
}
