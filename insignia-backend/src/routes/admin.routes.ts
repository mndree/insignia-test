import { Router, Response } from 'express';
import { adminService } from '../services/admin.service.js';
import { authMiddleware, AuthenticatedRequest } from '../auth/auth.middleware.js';

export const adminRouter = Router();

// Admin login
adminRouter.post('/login', async (req, res, next) => {
  try {
    const result = await adminService.login(req.body);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Admin register
adminRouter.post('/register', async (req, res, next) => {
  try {
    const result = await adminService.register(req.body);
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// List and search users
adminRouter.get('/users', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await adminService.getUsers(req.query);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Get single user details
adminRouter.get('/users/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await adminService.getUserDetails(id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Update user profile
adminRouter.patch('/users/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await adminService.updateUser(id, req.body);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Admin initiated transfer from user balance
adminRouter.post('/users/:id/transfer', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await adminService.transferUserBalance(id, req.body);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Admin top up user balance
adminRouter.post('/users/:id/topup', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const adminUsername = req.admin?.username || 'admin';
    const result = await adminService.topupUserBalance(id, req.body, adminUsername);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// List topups
adminRouter.get('/topups', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await adminService.getTopups(req.query, {
      id: req.user?.id,
      role: req.user ? 'USER' : 'ADMIN',
      isAdmin: req.isAdmin,
    });
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Get single topup details
adminRouter.get('/topups/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await adminService.getTopupById(id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Change admin password
adminRouter.patch('/change-password', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await adminService.changeAdminPassword(
      req.body.username,
      req.body.newPassword,
      req.body.currentPassword,
    );
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Get admin profile
adminRouter.get('/profile/:username', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
    const result = await adminService.getAdminProfile(username);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Update admin profile
adminRouter.patch('/profile/:username', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
    const result = await adminService.updateAdminProfile(username, req.body);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});
