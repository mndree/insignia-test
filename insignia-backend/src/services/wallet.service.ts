import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { signJwt } from '../auth/jwt.js';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '../errors.js';
import { Prisma } from '@prisma/client';
import type { User } from '@prisma/client';

export class WalletService {
  async checkUsername(username: string): Promise<{ exists: boolean; available: boolean; message: string }> {
    const cleanUsername = (username || '').trim().toLowerCase();
    if (!cleanUsername) {
      return { exists: false, available: true, message: 'Username is empty' };
    }
    const existingUser = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });
    const existingAdmin = await prisma.admin.findUnique({
      where: { username: cleanUsername },
    });

    const exists = Boolean(existingUser || existingAdmin);
    return {
      exists,
      available: !exists,
      message: exists
        ? `Username '${username}' is already taken.`
        : `Username '${username}' is available.`,
    };
  }

  async register(dto: {
    username?: string;
    password?: string;
    fullName?: string;
    dateOfBirth?: string;
    email?: string;
    phone?: string;
    address?: string;
  }): Promise<{ token: string }> {
    if (!dto.username || !dto.username.trim()) {
      throw new BadRequestException('Username is required');
    }

    const cleanUsername = dto.username.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (existing) {
      throw new ConflictException(`Username '${dto.username}' already exists`);
    }

    let hashedPassword: string | null = null;
    if (dto.password && dto.password.trim()) {
      hashedPassword = await bcrypt.hash(dto.password.trim(), 10);
    }

    const totalUsers = await prisma.user.count();
    let userCode = `USR-${String(totalUsers + 1).padStart(4, '0')}`;
    const codeExists = await prisma.user.findUnique({ where: { userCode } });
    if (codeExists) {
      userCode = `USR-${Date.now().toString().slice(-4)}`;
    }

    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        password: hashedPassword,
        fullName: dto.fullName?.trim() || cleanUsername,
        dateOfBirth: dto.dateOfBirth?.trim() || null,
        email: dto.email?.trim() || `${cleanUsername}@example.com`,
        phone: dto.phone?.trim() || null,
        address: dto.address?.trim() || null,
        userCode,
        status: 'Active',
        balance: 0,
      },
    });

    const token = signJwt({
      sub: user.id,
      username: user.username,
    });

    return { token };
  }

  async topup(user: User, dto: { amount?: number | string }): Promise<void> {
    const numAmount = Number(dto.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new BadRequestException('Topup amount must be greater than 0');
    }

    const decimalAmount = new Prisma.Decimal(numAmount);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          balance: {
            increment: decimalAmount,
          },
        },
      });

      await tx.topup.create({
        data: {
          userId: user.id,
          amount: decimalAmount,
        },
      });
    });
  }

  async getBalance(userId: string): Promise<{ balance: number }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      balance: Number(user.balance),
    };
  }

  async transfer(sender: User, dto: { to_username?: string; amount?: number | string }): Promise<void> {
    if (!dto.to_username) {
      throw new BadRequestException('Recipient username is required');
    }

    if (sender.username === dto.to_username) {
      throw new BadRequestException('Cannot transfer to yourself');
    }

    const recipient = await prisma.user.findUnique({
      where: { username: dto.to_username },
    });

    if (!recipient) {
      throw new NotFoundException(`Recipient '${dto.to_username}' not found`);
    }

    const numAmount = Number(dto.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new BadRequestException('Transfer amount must be greater than 0');
    }

    const decimalAmount = new Prisma.Decimal(numAmount);

    await prisma.$transaction(async (tx) => {
      const currentSender = await tx.user.findUnique({
        where: { id: sender.id },
      });

      if (!currentSender || currentSender.balance.lessThan(decimalAmount)) {
        throw new BadRequestException('Insufficient balance');
      }

      await tx.user.update({
        where: { id: sender.id },
        data: {
          balance: {
            decrement: decimalAmount,
          },
        },
      });

      await tx.user.update({
        where: { id: recipient.id },
        data: {
          balance: {
            increment: decimalAmount,
          },
        },
      });

      await tx.transfer.create({
        data: {
          fromUserId: sender.id,
          toUserId: recipient.id,
          amount: decimalAmount,
        },
      });
    });
  }

  async getTopTransactionsPerUser(user: User): Promise<Array<{ username: string; amount: number }>> {
    const transfers = await prisma.transfer.findMany({
      where: {
        OR: [{ fromUserId: user.id }, { toUserId: user.id }],
      },
      include: {
        fromUser: true,
        toUser: true,
      },
    });

    const formatted = transfers.map((tx) => {
      const isOutgoing = tx.fromUserId === user.id;
      const counterparty = isOutgoing ? tx.toUser.username : tx.fromUser.username;
      const rawAmount = Number(tx.amount);
      const amount = isOutgoing ? -rawAmount : rawAmount;

      return {
        username: counterparty,
        amount,
        absAmount: Math.abs(amount),
        createdAt: tx.createdAt.getTime(),
      };
    });

    formatted.sort((a, b) => {
      if (b.absAmount !== a.absAmount) {
        return b.absAmount - a.absAmount;
      }
      return b.createdAt - a.createdAt;
    });

    return formatted.slice(0, 10).map(({ username, amount }) => ({
      username,
      amount,
    }));
  }

  async getTopUsers(): Promise<Array<{ username: string; transacted_value: number }>> {
    const groups = await prisma.transfer.groupBy({
      by: ['fromUserId'],
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
      take: 10,
    });

    const activeGroups = groups.filter(
      (g) => g._sum.amount !== null && Number(g._sum.amount) > 0,
    );

    if (activeGroups.length === 0) {
      return [];
    }

    const userIds = activeGroups.map((g) => g.fromUserId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
    });

    const userMap = new Map(users.map((u) => [u.id, u.username]));

    return activeGroups.map((g) => ({
      username: userMap.get(g.fromUserId) ?? 'unknown',
      transacted_value: Number(g._sum.amount),
    }));
  }

  async getTransactions(user: User, query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.max(1, Number(query.pageSize) || 10);
    const isAdmin = user.username === 'admin';

    const transfers = await prisma.transfer.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [{ fromUserId: user.id }, { toUserId: user.id }],
          },
      include: {
        fromUser: true,
        toUser: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const topups = await prisma.topup.findMany({
      where: isAdmin ? {} : { userId: user.id },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    const unified: any[] = [];

    for (const tx of transfers) {
      let counterparty = '';
      let signedAmount = 0;

      if (tx.fromUserId === user.id) {
        counterparty = tx.toUser.username;
        signedAmount = -Number(tx.amount);
      } else if (tx.toUserId === user.id) {
        counterparty = tx.fromUser.username;
        signedAmount = Number(tx.amount);
      } else {
        counterparty = tx.toUser.username;
        signedAmount = -Number(tx.amount);
      }

      unified.push({
        id: tx.transferCode || tx.id.slice(0, 8),
        username: counterparty,
        amount: signedAmount,
        created_at: tx.createdAt.toISOString(),
        description: tx.description || tx.notes || `Transfer between @${tx.fromUser.username} and @${tx.toUser.username}`,
      });
    }

    for (const top of topups) {
      unified.push({
        id: top.topupCode || top.id.slice(0, 8),
        username: 'system',
        amount: Number(top.amount),
        created_at: top.createdAt.toISOString(),
        description: top.notes || 'Direct wallet balance top-up',
      });
    }

    unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    let filtered = unified;

    if (query.search && String(query.search).trim()) {
      const term = String(query.search).trim().toLowerCase();
      filtered = filtered.filter(
        (tx) =>
          tx.id.toLowerCase().includes(term) ||
          tx.username.toLowerCase().includes(term) ||
          (tx.description && tx.description.toLowerCase().includes(term)),
      );
    }

    if (query.direction && query.direction !== 'all') {
      if (query.direction === 'incoming') {
        filtered = filtered.filter((tx) => tx.amount > 0);
      } else if (query.direction === 'outgoing') {
        filtered = filtered.filter((tx) => tx.amount < 0);
      }
    }

    if (query.dateFrom) {
      const fromTime = new Date(query.dateFrom).getTime();
      if (!isNaN(fromTime)) {
        filtered = filtered.filter((tx) => new Date(tx.created_at).getTime() >= fromTime);
      }
    }

    if (query.dateTo) {
      const toTime = new Date(query.dateTo).getTime();
      if (!isNaN(toTime)) {
        filtered = filtered.filter((tx) => new Date(tx.created_at).getTime() <= toTime);
      }
    }

    if (query.sortBy) {
      const field = String(query.sortBy).toLowerCase();
      const isAsc = query.sortOrder === 'asc';
      filtered.sort((a, b) => {
        let cmp = 0;
        if (field === 'id') {
          cmp = a.id.localeCompare(b.id);
        } else if (field === 'username' || field === 'counterparty') {
          cmp = a.username.localeCompare(b.username);
        } else if (field === 'amount') {
          cmp = a.amount - b.amount;
        } else if (field === 'direction') {
          const dirA = a.amount > 0 ? 'incoming' : 'outgoing';
          const dirB = b.amount > 0 ? 'incoming' : 'outgoing';
          cmp = dirA.localeCompare(dirB);
        } else if (field === 'created_at' || field === 'date' || field === 'createdat') {
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        } else if (field === 'description') {
          cmp = (a.description || '').localeCompare(b.description || '');
        }
        return isAsc ? cmp : -cmp;
      });
    } else if (query.sortOrder === 'asc') {
      filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    const total = filtered.length;
    const skip = (page - 1) * pageSize;
    const items = filtered.slice(skip, skip + pageSize);

    return {
      items,
      page,
      pageSize,
      total,
    };
  }
}

export const walletService = new WalletService();
