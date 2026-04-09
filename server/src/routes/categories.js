import { Router } from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { slugify } from '../utils/helpers.js';
import { prisma } from '../utils/db.js';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { posts: true } } }
    });
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { posts: true } } }
    });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, validate(schemas.category), async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const slug = slugify(req.body.slug || name);

    const category = await prisma.category.create({
      data: { name, slug, description }
    });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, validate(schemas.category), async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const slug = slugify(req.body.slug || name);

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, slug, description }
    });
    res.json(category);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await prisma.category.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
