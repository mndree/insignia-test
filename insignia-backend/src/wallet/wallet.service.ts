import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterUserDto } from './dto/register-user.dto.js';
import { TopupDto } from './dto/topup.dto.js';
import { TransferDto } from './dto/transfer.dto.js';
import {
  TokenResponseDto,
  BalanceResponseDto,
  TransactionItemDto,
  TopUserItemDto,
} from './dto/response.dto.js';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterUserDto): Promise<TokenResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existing) {
      throw new ConflictException(`Username '${dto.username}' already exists`);
    }

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        balance: 0,
      },
    });

    const token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
    });

    return { token };
  }

  async topup(user: User, dto: TopupDto): Promise<void> {
    const decimalAmount = new Prisma.Decimal(dto.amount);

    await this.prisma.$transaction(async (tx) => {
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

  async getBalance(userId: string): Promise<BalanceResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      balance: Number(user.balance),
    };
  }

  async transfer(sender: User, dto: TransferDto): Promise<void> {
    if (sender.username === dto.to_username) {
      throw new BadRequestException('Cannot transfer to yourself');
    }

    const recipient = await this.prisma.user.findUnique({
      where: { username: dto.to_username },
    });

    if (!recipient) {
      throw new NotFoundException(`Recipient '${dto.to_username}' not found`);
    }

    const decimalAmount = new Prisma.Decimal(dto.amount);

    await this.prisma.$transaction(async (tx) => {
      // Fetch latest sender state with lock
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

  async getTopTransactionsPerUser(user: User): Promise<TransactionItemDto[]> {
    const transfers = await this.prisma.transfer.findMany({
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

    // Sort by absolute amount descending, tie-break by createdAt descending
    formatted.sort((a, b) => {
      if (b.absAmount !== a.absAmount) {
        return b.absAmount - a.absAmount;
      }
      return b.createdAt - a.createdAt;
    });

    // Return at most 10 transfers
    return formatted.slice(0, 10).map(({ username, amount }) => ({
      username,
      amount,
    }));
  }

  async getTopUsers(): Promise<TopUserItemDto[]> {
    const groups = await this.prisma.transfer.groupBy({
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
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
    });

    const userMap = new Map(users.map((u) => [u.id, u.username]));

    return activeGroups.map((g) => ({
      username: userMap.get(g.fromUserId) ?? 'unknown',
      transacted_value: Number(g._sum.amount),
    }));
  }
}
