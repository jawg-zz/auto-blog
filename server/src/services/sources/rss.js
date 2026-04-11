import Parser from 'rss-parser';
import { BaseSource } from './index.js';
import { logger } from '../../utils/logger.js';
import { extractExcerpt, sanitizeHtml } from '../../utils/helpers.js';
import { extractArticleContent } from '../../utils/articleExtractor.js';

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
        content: sanitizeHtml(item.content || item['content:encoded'] || item.summary || ''),
        excerpt: extractExcerpt(item.content || item.summary || ''),
        link: item.link,
        pubDate: item.pubDate || item.isoDate,
        categories: item.categories || [],
        author: item.creator || item.author
      }));

      if (this.config.fetchFullContent && items.length > 0) {
        return this.enrichWithFullContent(items);
      }

      return items;
    } catch (error) {
      logger.error(`Failed to fetch RSS feed ${this.config.url}:`, error);
      throw error;
    }
  }

  async enrichWithFullContent(items) {
    const enrichedItems = [];
    
    for (const item of items) {
      if (!item.link) {
        enrichedItems.push(item);
        continue;
      }

      try {
        const article = await extractArticleContent(item.link);
        if (article) {
          enrichedItems.push({
            ...item,
            content: article.content,
            excerpt: article.excerpt
          });
          logger.info(`Extracted full content from: ${item.link}`);
        } else {
          enrichedItems.push(item);
        }
      } catch (error) {
        logger.warn(`Failed to extract full content from ${item.link}:`, error.message);
        enrichedItems.push(item);
      }
    }

    return enrichedItems;
  }
}

export async function fetchRssFeed(url, options = {}) {
  const parser = new Parser({
    timeout: options.timeout || 10000
  });

  const feed = await parser.parseURL(url);
  
  const items = (feed.items || []).slice(0, options.maxItems || 50).map(item => ({
    title: item.title || 'Untitled',
    content: sanitizeHtml(item.content || item['content:encoded'] || ''),
    excerpt: extractExcerpt(item.content || ''),
    link: item.link,
    pubDate: item.pubDate || item.isoDate,
    categories: item.categories || []
  }));

  if (options.fetchFullContent && items.length > 0) {
    return {
      title: feed.title,
      description: feed.description,
      link: feed.link,
      items: await enrichItemsWithFullContent(items)
    };
  }

  return {
    title: feed.title,
    description: feed.description,
    link: feed.link,
    items
  };
}

async function enrichItemsWithFullContent(items) {
  const enriched = [];
  
  for (const item of items) {
    if (!item.link) {
      enriched.push(item);
      continue;
    }

    try {
      const article = await extractArticleContent(item.link);
      if (article) {
        enriched.push({
          ...item,
          content: article.content,
          excerpt: article.excerpt
        });
      } else {
        enriched.push(item);
      }
    } catch (error) {
      enriched.push(item);
    }
  }

  return enriched;
}

export const rssService = {
  fetchFeed: fetchRssFeed
};
