import Joi from 'joi';

export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }));
      
      return res.status(400).json({
        error: 'Validation Error',
        details
      });
    }
    
    next();
  };
};

export const schemas = {
  source: Joi.object({
    name: Joi.string().required().max(255),
    type: Joi.string().valid('rss', 'manual', 'ai_generation').required(),
    config: Joi.object().required(),
    enabled: Joi.boolean().default(true)
  }),

  post: Joi.object({
    title: Joi.string().required().max(500),
    content: Joi.string().required(),
    excerpt: Joi.string().allow(null, ''),
    status: Joi.string().valid('draft', 'scheduled', 'published', 'failed'),
    sourceId: Joi.string().uuid().allow(null),
    categoryId: Joi.string().uuid().allow(null),
    featuredImage: Joi.string().uri().allow(null, ''),
    seoTitle: Joi.string().max(500).allow(null, ''),
    seoDescription: Joi.string().allow(null, ''),
    tagIds: Joi.array().items(Joi.string().uuid())
  }),

  category: Joi.object({
    name: Joi.string().required().max(255),
    slug: Joi.string().max(255),
    description: Joi.string().allow(null, '')
  }),

  tag: Joi.object({
    name: Joi.string().required().max(255),
    slug: Joi.string().max(255)
  }),

  platform: Joi.object({
    name: Joi.string().required().max(255),
    type: Joi.string().valid('wordpress', 'ghost', 'medium', 'custom_api').required(),
    credentials: Joi.object().required(),
    enabled: Joi.boolean().default(true)
  }),

  schedule: Joi.object({
    name: Joi.string().required().max(255),
    sourceId: Joi.string().uuid().required(),
    platformIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
    cronExpression: Joi.string().required(),
    enabled: Joi.boolean().default(true)
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().max(255)
  })
};
