import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { getAccountById, getAccountsForUser } from '../services/accountService.js';

const router = Router();

const accountIdSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: z.object({ id: z.coerce.number().int().positive() }),
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const accounts = await getAccountsForUser(req.user);
    res.json(accounts);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAuth, validate(accountIdSchema), async (req, res, next) => {
  try {
    const account = await getAccountById(req.user, req.validated.params.id);
    res.json(account);
  } catch (error) {
    next(error);
  }
});

export default router;
