import fetch from 'node-fetch';
import { createHmac, randomBytes } from 'crypto';
import { BasePublisher } from './index.js';
import { logger } from '../../utils/logger.js';

export class GhostPublisher extends BasePublisher {
  constructor(credentials) {
    super(credentials);
    this.adminUrl = credentials.adminUrl.replace(/\/$/, '');
    this.apiKey = credentials.apiKey;
  }

  getAdminApiUrl() {
    return `${this.adminUrl}/ghost/api/admin/`;
  }

  async generateToken() {
    const [id, secret] = this.apiKey.split(':');
    if (!id || !secret) {
      throw new Error('Invalid Ghost API key format. Expected: id:secret');
    }

    // Ghost uses hex-decoded secret to sign a JWT with HS256
    const decodedSecret = Buffer.from(secret, 'hex');

    // Build the JWT header (base64url)
    const header = { alg: 'HS256', kid: id, typ: 'JWT' };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');

    // Build the JWT payload
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now,
      exp: now + 5 * 60, // 5 minutes
      aud: '/admin/'
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

    // Compute the signature
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const signature = createHmac('sha256', decodedSecret)
      .update(signatureInput)
      .digest('base64url');

    return `${signatureInput}.${signature}`;
  }

  async publish(post) {
    const postData = this.preparePostData(post);
    const token = await this.generateToken();

    try {
      const response = await fetch(`${this.getAdminApiUrl()}posts/`, {
        method: 'POST',
        headers: {
          'Authorization': `Ghost ${token}`,
          'Content-Type': 'application/json',
          'Accept-Version': 'v6.0'
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
      const token = await this.generateToken();
      const response = await fetch(`${this.getAdminApiUrl()}site/`, {
        headers: {
          'Authorization': `Ghost ${token}`,
          'Accept-Version': 'v6.0'
        }
      });

      if (response.ok) {
        const site = await response.json();
        return { success: true, site: { title: site.site?.title, url: this.adminUrl } };
      }

      const error = await response.json();
      return { success: false, error: error.errors?.[0]?.message || `Connection failed: ${response.status}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export async function testGhostConnection(credentials) {
  const publisher = new GhostPublisher(credentials);
  return publisher.testConnection();
}
