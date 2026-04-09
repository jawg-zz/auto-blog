import { Router } from 'express';
import sourcesRouter from './sources.js';
import postsRouter from './posts.js';
import categoriesRouter from './categories.js';
import tagsRouter from './tags.js';
import platformsRouter from './platforms.js';
import schedulesRouter from './schedules.js';
import dashboardRouter from './dashboard.js';
import aiRouter from './ai.js';
import authRouter from './auth.js';

const router = Router();

router.use('/sources', sourcesRouter);
router.use('/posts', postsRouter);
router.use('/categories', categoriesRouter);
router.use('/tags', tagsRouter);
router.use('/platforms', platformsRouter);
router.use('/schedules', schedulesRouter);
router.use('/dashboard', dashboardRouter);
router.use('/ai', aiRouter);
router.use('/auth', authRouter);

export default router;
