import Parser from 'rss-parser';
import { BaseSource } from './index.js';
import { logger } from '../../utils/logger.js';
import { extractExcerpt } from '../../utils/helpers.js';

export class RssSource extends BaseSource {
  constructor(config) {
    super(config);
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'AutoBlog-System/1.0'
      }
    });
  }

  async fetch() {
    try {
      const feed = await this.parser.parseURL(this.config.url);
      
      logger.info(`RSS feed fetched: ${this.config.url} (${feed.items?.length || 0} items)`);

      const items = (feed.items || []).slice(0, this.config.maxItems || 50).map(item => ({
        title: item.title || 'Untitled',
        content: item.content || item['content:encoded'] || item.summary || '',
        excerpt: extractExcerpt(item.content || item.summary || ''),
        link: item.link,
        pubDate: item.pubDate || item.isoDate,
        categories: item.categories || [],
        author: item.creator || item.author
      }));

      return items;
    } catch (error) {
      logger.error(`Failed to fetch RSS feed ${this.config.url}:`, error);
      throw error;
    }
  }
}

export async function fetchRssFeed(url, options = {}) {
  const parser = new Parser({
    timeout: options.timeout || 10000
  });

  const feed = await parser.parseURL(url);
  
  return {
    title: feed.title,
    description: feed.description,
    link: feed.link,
    items: (feed.items || []).slice(0, options.maxItems || 50).map(item => ({
      title: item.title || 'Untitled',
      content: item.content || item['content:encoded'] || '',
      excerpt: extractExcerpt(item.content || ''),
      link: item.link,
      pubDate: item.pubDate || item.isoDate,
      categories: item.categories || []
    }))
  };
}

export const rssService = {
  fetchFeed: fetchRssFeed
};
