import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { getTransactions, transferFunds } from '../services/accountService.js';

const router = Router();

const listSchema = z.object({
  body: z.object({}),
  query: z.object({
    accountId: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}),
});

const transferSchema = z.object({
  body: z.object({
    fromAccountId: z.number().int().positive(),
    toAccountNumber: z.string().regex(/^ACC\d{6}$/),
    amount: z.number().positive().max(1000000),
    description: z.string().max(240).optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

router.get('/', requireAuth, validate(listSchema), async (req, res, next) => {
  try {
    const transactions = await getTransactions(req.user, req.validated.query.accountId);
    res.json(transactions);
  } catch (error) {
    next(error);
  }
});

router.post('/transfer', requireAuth, validate(transferSchema), async (req, res, next) => {
  try {
    const result = await transferFunds({ actor: req.user, ...req.validated.body });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
