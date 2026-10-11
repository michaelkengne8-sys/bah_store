import { Router } from 'express';

const router = Router();

router.post('/', (_req, res) => {
  res.json({ url: '' });
});

export default router;
