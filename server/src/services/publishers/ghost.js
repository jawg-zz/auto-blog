import fetch from 'node-fetch';
import { BasePublisher } from './index.js';
import { logger } from '../../utils/logger.js';

export class GhostPublisher extends BasePublisher {
  constructor(credentials) {
    super(credentials);
    this.adminUrl = credentials.adminUrl.replace(/\/$/, '');
    this.apiKey = credentials.apiKey;
  }

  getAdminApiUrl() {
    const hash = Buffer.from(this.apiKey).toString('base64');
    return `${this.adminUrl}/ghost/api/admin/`;
  }

  async publish(post) {
    const postData = this.preparePostData(post);

    try {
      const response = await fetch(`${this.getAdminApiUrl()}posts/`, {
        method: 'POST',
        headers: {
          'Authorization': `Ghost ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          posts: [{
            title: postData.title,
            html: postData.content,
            excerpt: postData.excerpt || '',
            feature_image: postData.featuredImage,
            status: 'published',
            tags: (postData.tags || []).map(tag => ({ name: tag })),
            meta_title: postData.seo?.title,
            meta_description: postData.seo?.description
          }]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors?.[0]?.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      const publishedPost = result.posts?.[0];

      logger.info(`Post published to Ghost: ${publishedPost.url}`);
      
      return {
        success: true,
        url: publishedPost.url,
        id: publishedPost.id
      };
    } catch (error) {
      logger.error('Ghost publish failed:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      const response = await fetch(`${this.getAdminApiUrl()}site/`, {
        headers: {
          'Authorization': `Ghost ${this.apiKey}`
        }
      });

      if (response.ok) {
        const site = await response.json();
        return { success: true, site: { title: site.site?.title, url: this.adminUrl } };
      }

      return { success: false, error: `Connection failed: ${response.status}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export async function testGhostConnection(credentials) {
  const publisher = new GhostPublisher(credentials);
  return publisher.testConnection();
}
