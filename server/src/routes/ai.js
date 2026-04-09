import { Router } from 'express';
import { logger } from '../utils/logger.js';
import { authenticate } from '../middleware/auth.js';
import { generateContent, summarizeContent, repurposeContent } from '../services/ai/index.js';

const router = Router();

router.post('/generate', authenticate, async (req, res, next) => {
  try {
    const { prompt, options } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const content = await generateContent(prompt, options);
    res.json({ success: true, content });
  } catch (error) {
    logger.error('AI generation failed:', error);
    next(error);
  }
});

router.post('/summarize', authenticate, async (req, res, next) => {
  try {
    const { content, maxLength } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const summary = await summarizeContent(content, maxLength);
    res.json({ success: true, summary });
  } catch (error) {
    logger.error('AI summarization failed:', error);
    next(error);
  }
});

router.post('/repurpose', authenticate, async (req, res, next) => {
  try {
    const { content, targetPlatform } = req.body;
    
    if (!content || !targetPlatform) {
      return res.status(400).json({ error: 'Content and target platform are required' });
    }

    const repurposed = await repurposeContent(content, targetPlatform);
    res.json({ success: true, content: repurposed });
  } catch (error) {
    logger.error('AI repurposing failed:', error);
    next(error);
  }
});

export default router;
