import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    // Support both direct token and 'Bearer <token>' prefix
    const token = typeof authHeader === 'string'
      ? authHeader.replace(/^Bearer\s+/i, '').trim()
      : '';

    if (!token) {
      throw new UnauthorizedException('Authorization token is required');
    }

    try {
      const payload = this.jwtService.verify(token);

      // 1. Check if token belongs to an Admin
      if (payload.role === 'ADMIN') {
        const admin = await this.prisma.admin.findUnique({
          where: { id: payload.sub },
        });

        if (!admin) {
          throw new UnauthorizedException('Admin account not found');
        }

        // Fetch or create matching user record for admin
        let user = await this.prisma.user.findUnique({
          where: { username: admin.username },
        });

        if (!user) {
          user = await this.prisma.user.create({
            data: { username: admin.username, balance: 1000 },
          });
        }

        request.admin = admin;
        request.user = user;
        request.isAdmin = true;
        return true;
      }

      // 2. Standard User token
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      request.user = user;
      request.isAdmin = false;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
