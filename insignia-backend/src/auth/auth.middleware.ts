import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from './jwt.js';
import { prisma } from '../prisma.js';

export interface AuthenticatedRequest extends Request {
  user?: any;
  admin?: any;
  isAdmin?: boolean;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      message: 'Missing Authorization header',
      error: 'Unauthorized',
      statusCode: 401,
    });
  }

  const token = typeof authHeader === 'string'
    ? authHeader.replace(/^Bearer\s+/i, '').trim()
    : '';

  if (!token) {
    return res.status(401).json({
      message: 'Authorization token is required',
      error: 'Unauthorized',
      statusCode: 401,
    });
  }

  try {
    const payload = verifyJwt(token);

    if (payload.role === 'ADMIN') {
      const admin = await prisma.admin.findUnique({
        where: { id: payload.sub },
      });

      if (!admin) {
        return res.status(401).json({
          message: 'Admin account not found',
          error: 'Unauthorized',
          statusCode: 401,
        });
      }

      let user = await prisma.user.findUnique({
        where: { username: admin.username },
      });

      if (!user) {
        user = await prisma.user.create({
          data: { username: admin.username, balance: 1000 },
        });
      }

      req.admin = admin;
      req.user = user;
      req.isAdmin = true;
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      return res.status(401).json({
        message: 'User not found',
        error: 'Unauthorized',
        statusCode: 401,
      });
    }

    req.user = user;
    req.isAdmin = false;
    return next();
  } catch {
    return res.status(401).json({
      message: 'Invalid or expired token',
      error: 'Unauthorized',
      statusCode: 401,
    });
  }
}
