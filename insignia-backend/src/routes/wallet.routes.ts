import { Router, Response } from 'express';
import { walletService } from '../services/wallet.service.js';
import { adminService } from '../services/admin.service.js';
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

// User profile endpoints (Must be declared before dynamic parameter routes)
walletRouter.get(['/user/profile', '/profile/me'], authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await walletService.getUserProfile(req.user.id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

walletRouter.patch(['/user/profile', '/profile/me'], authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await walletService.updateUserProfile(req.user.id, req.body);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

walletRouter.patch(['/user/change-password', '/profile/change-password'], authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await walletService.changeUserPassword(req.user.id, req.body);
    return res.status(200).json(result);
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

// Top up balance (Admin only)
walletRouter.post('/topup', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({
        message: 'Top up feature is restricted to administrators only',
        error: 'Forbidden',
        statusCode: 403,
      });
    }
    const adminUsername = req.admin?.username || req.user?.username || 'admin';
    await walletService.topup(req.user, req.body, adminUsername);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Get balance
walletRouter.get('/balance', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await walletService.getBalance(req.user.id, req.isAdmin);
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
    const result = await walletService.getTopTransactionsPerUser(req.user, req.isAdmin);
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

// Paginated topups list
walletRouter.get('/topups', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await adminService.getTopups(req.query, {
      id: req.user?.id,
      role: req.isAdmin ? 'ADMIN' : 'USER',
      isAdmin: req.isAdmin,
    });
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Single topup details
walletRouter.get('/topups/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await adminService.getTopupById(id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});
