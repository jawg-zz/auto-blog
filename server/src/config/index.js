// Server environment configuration
export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/autoblog'
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: '7d'
  },
  
  queue: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    timeout: 300000 // 5 minutes
  },
  
  ai: {
    defaultProvider: process.env.AI_PROVIDER || 'openai',
    openai: {
      apiKey: process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY,
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      maxTokens: 2000
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: 'claude-3-sonnet-20240229',
      maxTokens: 2000
    }
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'combined'
  }
};
