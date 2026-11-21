import { Router, Response } from 'express';
import { walletService } from '../services/wallet.service.js';
import { authMiddleware, AuthenticatedRequest } from '../auth/auth.middleware.js';

export const walletRouter = Router();

// Register user
walletRouter.post(['/user', '/register'], async (req, res, next) => {
  try {
    const result = await walletService.register(req.body);
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// Check username availability
walletRouter.get(['/user/check-username/:username', '/check-username/:username'], async (req, res, next) => {
  try {
    const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
    const result = await walletService.checkUsername(username);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

walletRouter.post('/user/check-username', async (req, res, next) => {
  try {
    const result = await walletService.checkUsername(req.body.username);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Top up balance
walletRouter.post('/topup', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    await walletService.topup(req.user, req.body);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Get balance
walletRouter.get('/balance', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await walletService.getBalance(req.user.id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Transfer funds
walletRouter.post('/transfer', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    await walletService.transfer(req.user, req.body);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Top transactions per user
walletRouter.get('/top_transactions_per_user', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await walletService.getTopTransactionsPerUser(req.user);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Top users by outgoing transfer value
walletRouter.get('/top_users', authMiddleware, async (_req, res, next) => {
  try {
    const result = await walletService.getTopUsers();
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Paginated transactions
walletRouter.get('/transactions', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await walletService.getTransactions(req.user, req.query);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});
