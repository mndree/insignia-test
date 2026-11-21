import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { signJwt } from '../auth/jwt.js';
import {
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '../errors.js';
import { Prisma } from '@prisma/client';

export class AdminService {
  async ensureDefaultAdmin() {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.admin.upsert({
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

    await prisma.user.upsert({
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

    console.log(`[AdminService] Ensured default admin account: 'admin' / 'admin123' with complete biodata`);
  }

  async register(dto: { username?: string; password?: string }) {
    if (!dto.username || !dto.password) {
      throw new BadRequestException('Username and password are required');
    }

    const cleanUsername = dto.username.trim().toLowerCase();
    const existing = await prisma.admin.findUnique({
      where: { username: cleanUsername },
    });

    if (existing) {
      throw new ConflictException(`Admin '${cleanUsername}' already exists`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const admin = await prisma.admin.create({
      data: {
        username: cleanUsername,
        password: hashedPassword,
      },
    });

    const user = await prisma.user.upsert({
      where: { username: cleanUsername },
      create: {
        username: cleanUsername,
        fullName: cleanUsername,
        balance: 1000,
        status: 'Active',
      },
      update: {},
    });

    const token = signJwt({
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

  async login(dto: { username?: string; password?: string }) {
    if (!dto.username || !dto.password) {
      throw new BadRequestException('Username and password are required');
    }

    const cleanUsername = dto.username.trim();

    // 1. Check if username exists in 'admins' table -> Login as ADMIN
    const admin = await prisma.admin.findFirst({
      where: { username: { equals: cleanUsername, mode: 'insensitive' } },
    });

    if (admin) {
      const isMatch = await bcrypt.compare(dto.password, admin.password);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const user = await prisma.user.upsert({
        where: { username: admin.username },
        create: {
          userCode: 'USR-0000',
          username: admin.username,
          fullName: admin.fullName || 'System Administrator',
          balance: 18150,
          status: 'Active',
        },
        update: {},
      });

      const token = signJwt({
        sub: admin.id,
        username: admin.username,
        role: 'ADMIN',
        userId: user.id,
      });

      return {
        token,
        role: 'ADMIN',
        admin: {
          id: admin.id,
          username: admin.username,
          fullName: admin.fullName || 'System Administrator',
        },
        user: {
          id: user.id,
          username: admin.username,
          fullName: admin.fullName || 'System Administrator',
          role: 'ADMIN',
        },
      };
    }

    // 2. Check if username exists in 'users' table -> Login as USER
    const user = await prisma.user.findFirst({
      where: { username: { equals: cleanUsername, mode: 'insensitive' } },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.password) {
      const isUserMatch = await bcrypt.compare(dto.password, user.password);
      if (!isUserMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }
    } else {
      // Legacy or seed accounts without hashed password
      if (dto.password !== 'password123' && dto.password !== 'admin123') {
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    const token = signJwt({
      sub: user.id,
      username: user.username,
      role: 'USER',
      userId: user.id,
    });

    return {
      token,
      role: 'USER',
      admin: null,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName || user.username,
        role: 'USER',
      },
    };
  }

  async getUsers(query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.max(1, Number(query.pageSize) || 10);
    const skip = (page - 1) * pageSize;

    const where: Prisma.UserWhereInput = {
      username: { not: 'admin' },
    };

    if (query.search && String(query.search).trim()) {
      const term = String(query.search).trim();
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
      const field = String(query.sortBy).toLowerCase();
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
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
      }),
      prisma.user.count({ where }),
      prisma.user.count({ where: baseWhere }),
      prisma.user.count({ where: { ...baseWhere, status: 'Active' } }),
      prisma.user.aggregate({
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
    const user = await prisma.user.findFirst({
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

    let totalSent = 0;
    for (const t of user.sentTransfers) {
      totalSent += Number(t.amount);
    }

    let totalReceived = 0;
    for (const t of user.receivedTransfers) {
      totalReceived += Number(t.amount);
    }

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

  async updateUser(id: string, dto: any) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id }, { username: id }, { userCode: id }],
      },
    });

    if (!user) {
      throw new NotFoundException(`User '${id}' not found`);
    }

    const dataToUpdate: any = {};

    if (dto.fullName !== undefined) dataToUpdate.fullName = dto.fullName?.trim() || null;
    if (dto.email !== undefined) dataToUpdate.email = dto.email?.trim() || null;
    if (dto.phone !== undefined) dataToUpdate.phone = dto.phone?.trim() || null;
    if (dto.dateOfBirth !== undefined) dataToUpdate.dateOfBirth = dto.dateOfBirth?.trim() || null;
    if (dto.address !== undefined) dataToUpdate.address = dto.address?.trim() || null;
    if (dto.status !== undefined) dataToUpdate.status = dto.status;

    // Optional userCode update with uniqueness check
    if (dto.userCode !== undefined && dto.userCode.trim()) {
      const cleanCode = dto.userCode.trim();
      if (cleanCode !== user.userCode) {
        const codeConflict = await prisma.user.findUnique({
          where: { userCode: cleanCode },
        });
        if (codeConflict && codeConflict.id !== user.id) {
          throw new ConflictException(`User Code '${cleanCode}' is already in use`);
        }
        dataToUpdate.userCode = cleanCode;
      }
    }

    // Optional username update with dual-table uniqueness check
    if (dto.username !== undefined && dto.username.trim()) {
      const cleanUsername = dto.username.trim();
      if (cleanUsername.toLowerCase() !== user.username.toLowerCase()) {
        const userConflict = await prisma.user.findFirst({
          where: { username: { equals: cleanUsername, mode: 'insensitive' } },
        });
        const adminConflict = await prisma.admin.findFirst({
          where: { username: { equals: cleanUsername, mode: 'insensitive' } },
        });
        if (userConflict || adminConflict) {
          throw new ConflictException(`Username '${dto.username}' already exists`);
        }
        dataToUpdate.username = cleanUsername;
      }
    }

    // Optional balance adjustment
    if (dto.balance !== undefined && dto.balance !== null && dto.balance !== '') {
      const numBalance = Number(dto.balance);
      if (!isNaN(numBalance) && numBalance >= 0) {
        dataToUpdate.balance = new Prisma.Decimal(numBalance);
      }
    }

    // Optional password reset
    if (dto.password && dto.password.trim()) {
      const hashedPassword = await bcrypt.hash(dto.password.trim(), 10);
      dataToUpdate.password = hashedPassword;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: dataToUpdate,
    });

    return updated;
  }

  async transferUserBalance(fromUserId: string, dto: { to_username?: string; amount?: number | string; notes?: string }) {
    const sender = await prisma.user.findFirst({
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
        `Insufficient balance. Available: ${sender.balance} units, requested: ${amount} units`,
      );
    }

    if (!dto.to_username) {
      throw new BadRequestException('Recipient username is required');
    }

    const recipient = await prisma.user.findUnique({
      where: { username: dto.to_username.trim().toLowerCase() },
    });

    if (!recipient) {
      throw new NotFoundException(`Recipient user '${dto.to_username}' not found`);
    }

    if (sender.id === recipient.id) {
      throw new BadRequestException('Cannot transfer funds to the same user');
    }

    const transferCount = await prisma.transfer.count();
    const transferCode = `TXN-${9022 + transferCount}`;

    const [transfer] = await prisma.$transaction([
      prisma.transfer.create({
        data: {
          transferCode,
          fromUserId: sender.id,
          toUserId: recipient.id,
          amount,
          notes: dto.notes,
        },
      }),
      prisma.user.update({
        where: { id: sender.id },
        data: { balance: { decrement: amount } },
      }),
      prisma.user.update({
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

    const admin = await prisma.admin.findUnique({ where: { username } });
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

      await prisma.admin.update({
        where: { username },
        data: { password: hashedPassword },
      });

      const user = await prisma.user.findUnique({ where: { username } });
      if (user) {
        await prisma.user.update({
          where: { username },
          data: { password: hashedPassword },
        });
      }

      return {
        success: true,
        message: 'Password successfully changed',
      };
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (user) {
      if (currentPassword && user.password) {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          throw new BadRequestException('Current password does not match.');
        }

        const isSame = await bcrypt.compare(newPassword, user.password);
        if (isSame) {
          throw new BadRequestException('Your new password must be different from your current password.');
        }
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { username },
        data: { password: hashedPassword },
      });

      return {
        success: true,
        message: 'Password successfully changed',
      };
    }

    throw new NotFoundException(`Account '${username}' not found`);
  }

  async getAdminProfile(username: string) {
    const admin = await prisma.admin.findUnique({
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
        avatarUrl: admin.avatarUrl || null,
        status: 'Active',
      };
    }

    const user = await prisma.user.findUnique({
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
      avatarUrl: (user as any).avatarUrl || null,
      status: user.status || 'Active',
    };
  }

  async updateAdminProfile(username: string, dto: any) {
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (admin) {
      const updatedAdmin = await prisma.admin.update({
        where: { username },
        data: {
          fullName: dto.fullName !== undefined ? dto.fullName : admin.fullName,
          email: dto.email !== undefined ? dto.email : admin.email,
          phone: dto.phone !== undefined ? dto.phone : admin.phone,
          dateOfBirth: dto.dateOfBirth !== undefined ? dto.dateOfBirth : admin.dateOfBirth,
          gender: dto.gender !== undefined ? dto.gender : admin.gender,
          address: dto.address !== undefined ? dto.address : admin.address,
          avatarUrl: dto.avatarUrl !== undefined ? (dto.avatarUrl || null) : admin.avatarUrl,
        },
      });

      const user = await prisma.user.findUnique({ where: { username } });
      if (user) {
        await prisma.user.update({
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

    const user = await prisma.user.findUnique({ where: { username } });
    if (user) {
      const updatedUser = await prisma.user.update({
        where: { username },
        data: {
          fullName: dto.fullName !== undefined ? dto.fullName : user.fullName,
          email: dto.email !== undefined ? dto.email : user.email,
          phone: dto.phone !== undefined ? dto.phone : user.phone,
          dateOfBirth: dto.dateOfBirth !== undefined ? dto.dateOfBirth : user.dateOfBirth,
          address: dto.address !== undefined ? dto.address : user.address,
        },
      });

      return {
        id: updatedUser.id,
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        dateOfBirth: updatedUser.dateOfBirth,
        address: updatedUser.address,
      };
    }

    throw new NotFoundException(`Account '${username}' not found`);
  }
}

export const adminService = new AdminService();
