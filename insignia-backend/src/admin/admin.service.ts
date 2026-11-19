import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminLoginDto } from './dto/admin-login.dto.js';
import { AdminRegisterDto } from './dto/admin-register.dto.js';
import { AdminLoginResponseDto } from './dto/admin-response.dto.js';
import { UsersQueryDto, UpdateUserDto, AdminTransferDto } from './dto/admin-user.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit() {
    await this.ensureDefaultAdmin();
  }

  async ensureDefaultAdmin() {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await this.prisma.admin.upsert({
      where: { username: 'admin' },
      create: {
        username: 'admin',
        password: hashedPassword,
        fullName: 'Andre Juliansyah',
        email: 'andre@example.com',
        phone: '+62 812 3456 7890',
        dateOfBirth: '15 May 1996',
        gender: 'Male',
        address: 'Jakarta, Indonesia',
      },
      update: {
        fullName: 'Andre Juliansyah',
        email: 'andre@example.com',
        phone: '+62 812 3456 7890',
        dateOfBirth: '15 May 1996',
        gender: 'Male',
        address: 'Jakarta, Indonesia',
      },
    });

    // Also ensure a corresponding user record exists for transfers/topups
    await this.prisma.user.upsert({
      where: { username: 'admin' },
      create: {
        userCode: 'USR-0000',
        username: 'admin',
        fullName: 'Andre Juliansyah',
        email: 'andre@example.com',
        phone: '+62 812 3456 7890',
        dateOfBirth: '15 May 1996',
        address: 'Jakarta, Indonesia',
        status: 'Active',
        balance: 14250,
      },
      update: {
        fullName: 'Andre Juliansyah',
        email: 'andre@example.com',
        phone: '+62 812 3456 7890',
        dateOfBirth: '15 May 1996',
        address: 'Jakarta, Indonesia',
      },
    });

    this.logger.log(`Ensured default admin account: 'admin' / 'admin123' with complete biodata`);
  }

  async register(dto: AdminRegisterDto): Promise<AdminLoginResponseDto> {
    const existing = await this.prisma.admin.findUnique({
      where: { username: dto.username },
    });

    if (existing) {
      throw new ConflictException(`Admin '${dto.username}' already exists`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const admin = await this.prisma.admin.create({
      data: {
        username: dto.username,
        password: hashedPassword,
      },
    });

    // Ensure corresponding user record
    const user = await this.prisma.user.upsert({
      where: { username: dto.username },
      create: {
        username: dto.username,
        fullName: dto.username,
        balance: 1000,
        status: 'Active',
      },
      update: {},
    });

    const token = this.jwtService.sign({
      sub: admin.id,
      username: admin.username,
      role: 'ADMIN',
      userId: user.id,
    });

    return {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    };
  }

  async login(dto: AdminLoginDto): Promise<AdminLoginResponseDto> {
    const admin = await this.prisma.admin.findUnique({
      where: { username: dto.username },
    });

    if (admin) {
      const isMatch = await bcrypt.compare(dto.password, admin.password);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const user = await this.prisma.user.upsert({
        where: { username: admin.username },
        create: {
          userCode: 'USR-0000',
          username: admin.username,
          fullName: 'System Administrator',
          balance: 18150,
          status: 'Active',
        },
        update: {},
      });

      const token = this.jwtService.sign({
        sub: admin.id,
        username: admin.username,
        role: 'ADMIN',
        userId: user.id,
      });

      return {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
        },
        user: {
          username: admin.username,
        },
      };
    }

    // Check if it is a regular user logging in (e.g. andre)
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isUserMatch = await bcrypt.compare(dto.password, user.password);
    if (!isUserMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
      role: 'USER',
      userId: user.id,
    });

    return {
      token,
      admin: {
        id: user.id,
        username: user.username,
      },
      user: {
        username: user.username,
      },
    };
  }

  // ==========================================
  // Admin User Management Services
  // ==========================================

  async getUsers(query: UsersQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.max(1, Number(query.pageSize) || 10);
    const skip = (page - 1) * pageSize;

    const where: Prisma.UserWhereInput = {
      username: { not: 'admin' },
    };

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.AND = [
        {
          OR: [
            { fullName: { contains: term, mode: 'insensitive' } },
            { username: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
            { userCode: { contains: term, mode: 'insensitive' } },
          ],
        },
      ];
    }

    if (query.status && query.status !== 'All statuses') {
      where.status = { equals: query.status, mode: 'insensitive' };
    }

    const baseWhere: Prisma.UserWhereInput = {
      username: { not: 'admin' },
    };

    const orderDirection: Prisma.SortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';
    let orderBy: Prisma.UserOrderByWithRelationInput[] = [{ userCode: 'asc' }, { createdAt: 'desc' }];

    if (query.sortBy) {
      const field = query.sortBy.toLowerCase();
      if (field === 'user' || field === 'name' || field === 'fullname') {
        orderBy = [{ fullName: orderDirection }, { username: orderDirection }];
      } else if (field === 'email') {
        orderBy = [{ email: orderDirection }];
      } else if (field === 'balance') {
        orderBy = [{ balance: orderDirection }];
      } else if (field === 'status') {
        orderBy = [{ status: orderDirection }];
      } else if (field === 'createdat' || field === 'joineddate' || field === 'date') {
        orderBy = [{ createdAt: orderDirection }];
      } else if (field === 'usercode') {
        orderBy = [{ userCode: orderDirection }];
      }
    }

    const [items, total, totalUsers, activeUsers, balanceAggregate] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
      }),
      this.prisma.user.count({ where }),
      this.prisma.user.count({ where: baseWhere }),
      this.prisma.user.count({ where: { ...baseWhere, status: 'Active' } }),
      this.prisma.user.aggregate({
        where: baseWhere,
        _sum: {
          balance: true,
        },
      }),
    ]);

    const totalWalletBalance = Number(balanceAggregate._sum.balance || 0);

    return {
      items: items.map((u) => ({
        id: u.id,
        userCode: u.userCode || u.id.slice(0, 8),
        username: u.username,
        fullName: u.fullName || u.username,
        email: u.email || `${u.username}@example.com`,
        phone: u.phone || '-',
        dateOfBirth: u.dateOfBirth || '-',
        address: u.address || '-',
        status: u.status,
        balance: Number(u.balance),
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      })),
      page,
      pageSize,
      total,
      stats: {
        totalUsers,
        activeUsers,
        totalWalletBalance,
      },
    };
  }

  async getUserDetails(idOrUsername: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { id: idOrUsername },
          { username: idOrUsername },
          { userCode: idOrUsername },
        ],
      },
      include: {
        sentTransfers: {
          include: { toUser: true },
          orderBy: { createdAt: 'desc' },
        },
        receivedTransfers: {
          include: { fromUser: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User '${idOrUsername}' not found`);
    }

    // Calculate total received and total sent
    let totalSent = 0;
    for (const t of user.sentTransfers) {
      totalSent += Number(t.amount);
    }

    let totalReceived = 0;
    for (const t of user.receivedTransfers) {
      totalReceived += Number(t.amount);
    }

    // Combine and sort recent transactions
    const allTransfers = [
      ...user.sentTransfers.map((t) => ({
        id: t.transferCode || t.id.slice(0, 8),
        counterparty: t.toUser.username,
        counterpartyName: t.toUser.fullName || t.toUser.username,
        direction: 'outgoing' as const,
        amount: -Number(t.amount),
        createdAt: t.createdAt,
        notes: t.notes,
      })),
      ...user.receivedTransfers.map((t) => ({
        id: t.transferCode || t.id.slice(0, 8),
        counterparty: t.fromUser.username,
        counterpartyName: t.fromUser.fullName || t.fromUser.username,
        direction: 'incoming' as const,
        amount: Number(t.amount),
        createdAt: t.createdAt,
        notes: t.notes,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      id: user.id,
      userCode: user.userCode || 'USR-0001',
      username: user.username,
      fullName: user.fullName || user.username,
      email: user.email || `${user.username}@example.com`,
      phone: user.phone || '+62 812 3456 7890',
      dateOfBirth: user.dateOfBirth || '15 May 1996',
      address: user.address || 'South Jakarta, Indonesia',
      status: user.status,
      balance: Number(user.balance),
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      stats: {
        availableBalance: Number(user.balance),
        totalReceived,
        totalSent,
      },
      recentTransactions: allTransfers.slice(0, 10),
    };
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ id }, { username: id }, { userCode: id }],
      },
    });

    if (!user) {
      throw new NotFoundException(`User '${id}' not found`);
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.dateOfBirth !== undefined && { dateOfBirth: dto.dateOfBirth }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });

    return updated;
  }

  async transferUserBalance(fromUserId: string, dto: AdminTransferDto) {
    const sender = await this.prisma.user.findFirst({
      where: {
        OR: [{ id: fromUserId }, { username: fromUserId }, { userCode: fromUserId }],
      },
    });

    if (!sender) {
      throw new NotFoundException(`Sender user '${fromUserId}' not found`);
    }

    const amount = Number(dto.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Transfer amount must be greater than 0');
    }

    if (Number(sender.balance) < amount) {
      throw new BadRequestException(
        `Insufficient balance. Available: ${sender.balance} units, requested: ${amount} units`
      );
    }

    const recipient = await this.prisma.user.findUnique({
      where: { username: dto.to_username.trim().toLowerCase() },
    });

    if (!recipient) {
      throw new NotFoundException(`Recipient user '${dto.to_username}' not found`);
    }

    if (sender.id === recipient.id) {
      throw new BadRequestException('Cannot transfer funds to the same user');
    }

    const transferCount = await this.prisma.transfer.count();
    const transferCode = `TXN-${9022 + transferCount}`;

    // Execute atomic balance update and transfer record in transaction
    const [transfer] = await this.prisma.$transaction([
      this.prisma.transfer.create({
        data: {
          transferCode,
          fromUserId: sender.id,
          toUserId: recipient.id,
          amount,
          notes: dto.notes,
        },
      }),
      this.prisma.user.update({
        where: { id: sender.id },
        data: { balance: { decrement: amount } },
      }),
      this.prisma.user.update({
        where: { id: recipient.id },
        data: { balance: { increment: amount } },
      }),
    ]);

    return {
      success: true,
      transferCode: transfer.transferCode,
      amount,
      senderBalanceAfter: Number(sender.balance) - amount,
    };
  }

  async changeAdminPassword(username: string, newPassword: string, currentPassword?: string) {
    if (!username || !newPassword) {
      throw new BadRequestException('Username and new password are required');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols.');
    }

    const admin = await this.prisma.admin.findUnique({ where: { username } });
    if (admin) {
      if (currentPassword) {
        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
          throw new BadRequestException('Current password does not match.');
        }

        const isSame = await bcrypt.compare(newPassword, admin.password);
        if (isSame) {
          throw new BadRequestException('Your new password must be different from your current password.');
        }
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.prisma.admin.update({
        where: { username },
        data: { password: hashedPassword },
      });

      // Also update in users table if exists
      const user = await this.prisma.user.findUnique({ where: { username } });
      if (user) {
        await this.prisma.user.update({
          where: { username },
          data: { password: hashedPassword },
        });
      }

      return {
        success: true,
        message: 'Password successfully changed',
      };
    }

    throw new NotFoundException(`Admin account '${username}' not found`);
  }

  async getAdminProfile(username: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { username },
    });

    if (admin) {
      return {
        id: admin.id,
        username: admin.username,
        fullName: admin.fullName || 'Andre Juliansyah',
        email: admin.email || 'andre@example.com',
        phone: admin.phone || '+62 812 3456 7890',
        dateOfBirth: admin.dateOfBirth || '15 May 1996',
        gender: admin.gender || 'Male',
        address: admin.address || 'Jakarta, Indonesia',
        status: 'Active',
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException(`Account '${username}' not found`);
    }

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName || user.username,
      email: user.email || `${user.username}@example.com`,
      phone: user.phone || '',
      dateOfBirth: user.dateOfBirth || '',
      gender: 'Male',
      address: user.address || '',
      status: user.status || 'Active',
    };
  }

  async updateAdminProfile(username: string, dto: any) {
    const admin = await this.prisma.admin.findUnique({ where: { username } });
    if (admin) {
      const updatedAdmin = await this.prisma.admin.update({
        where: { username },
        data: {
          fullName: dto.fullName !== undefined ? dto.fullName : admin.fullName,
          email: dto.email !== undefined ? dto.email : admin.email,
          phone: dto.phone !== undefined ? dto.phone : admin.phone,
          dateOfBirth: dto.dateOfBirth !== undefined ? dto.dateOfBirth : admin.dateOfBirth,
          gender: dto.gender !== undefined ? dto.gender : admin.gender,
          address: dto.address !== undefined ? dto.address : admin.address,
        },
      });

      // Also sync user table
      const user = await this.prisma.user.findUnique({ where: { username } });
      if (user) {
        await this.prisma.user.update({
          where: { username },
          data: {
            fullName: dto.fullName !== undefined ? dto.fullName : user.fullName,
            email: dto.email !== undefined ? dto.email : user.email,
            phone: dto.phone !== undefined ? dto.phone : user.phone,
            dateOfBirth: dto.dateOfBirth !== undefined ? dto.dateOfBirth : user.dateOfBirth,
            address: dto.address !== undefined ? dto.address : user.address,
          },
        });
      }

      return updatedAdmin;
    }

    throw new NotFoundException(`Admin account '${username}' not found`);
  }
}
