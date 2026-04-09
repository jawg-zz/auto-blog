import fetch from 'node-fetch';
import { BasePublisher } from './index.js';
import { logger } from '../../utils/logger.js';

export class CustomApiPublisher extends BasePublisher {
  constructor(credentials) {
    super(credentials);
    this.baseUrl = credentials.baseUrl.replace(/\/$/, '');
    this.apiKey = credentials.apiKey;
    this.headers = credentials.headers || {};
  }

  async publish(post) {
    const postData = this.preparePostData(post);

    try {
      const response = await fetch(`${this.baseUrl}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...this.headers
        },
        body: JSON.stringify({
          title: postData.title,
          content: postData.content,
          excerpt: postData.excerpt,
          featuredImage: postData.featuredImage,
          categories: postData.categories,
          tags: postData.tags,
          seo: postData.seo
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      const url = result.url || result.link || result.data?.url || `${this.baseUrl}/posts/${result.id}`;
      
      logger.info(`Post published to Custom API: ${url}`);
      
      return {
        success: true,
        url,
        id: result.id
      };
    } catch (error) {
      logger.error('Custom API publish failed:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          ...this.headers
        }
      });

      if (response.ok) {
        return { success: true, message: 'Connection successful' };
      }

      return { success: false, error: `Health check failed: ${response.status}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export async function testCustomApiConnection(credentials) {
  const publisher = new CustomApiPublisher(credentials);
  return publisher.testConnection();
}
