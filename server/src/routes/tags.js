import { Router } from 'express';
import { validate, schemas } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { slugify } from '../utils/helpers.js';
import { prisma } from '../utils/db.js';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { posts: true } } }
    });
    res.json(tags);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const tag = await prisma.tag.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { posts: true } } }
    });
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    res.json(tag);
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, validate(schemas.tag), async (req, res, next) => {
  try {
    const { name } = req.body;
    const slug = slugify(req.body.slug || name);

    const tag = await prisma.tag.create({
      data: { name, slug }
    });
    res.status(201).json(tag);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, validate(schemas.tag), async (req, res, next) => {
  try {
    const { name } = req.body;
    const slug = slugify(req.body.slug || name);

    const tag = await prisma.tag.update({
      where: { id: req.params.id },
      data: { name, slug }
    });
    res.json(tag);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await prisma.tag.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
