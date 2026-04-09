import { logger } from '../../utils/logger.js';
import { delay } from '../../utils/helpers.js';

export class BasePublisher {
  constructor(credentials) {
    this.credentials = credentials;
  }

  async publish(post) {
    throw new Error('publish() must be implemented by subclass');
  }

  async testConnection() {
    throw new Error('testConnection() must be implemented by subclass');
  }

  preparePostData(post) {
    return {
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage,
      categories: post.categories,
      tags: post.tags,
      seo: {
        title: post.seoTitle,
        description: post.seoDescription
      }
    };
  }
}
