import { logger } from '../../utils/logger.js';

export class BaseSource {
  constructor(config) {
    this.config = config;
  }

  async fetch() {
    throw new Error('fetch() must be implemented by subclass');
  }

  async process(item) {
    throw new Error('process() must be implemented by subclass');
  }
}
