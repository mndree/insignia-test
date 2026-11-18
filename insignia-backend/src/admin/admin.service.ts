import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminLoginDto } from './dto/admin-login.dto.js';
import { AdminRegisterDto } from './dto/admin-register.dto.js';
import { AdminLoginResponseDto } from './dto/admin-response.dto.js';

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
    const existing = await this.prisma.admin.findUnique({
      where: { username: 'admin' },
    });

    if (!existing) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = await this.prisma.admin.create({
        data: {
          username: 'admin',
          password: hashedPassword,
        },
      });

      // Also ensure a corresponding user record exists for transfers/topups
      await this.prisma.user.upsert({
        where: { username: 'admin' },
        create: { username: 'admin', balance: 1000 },
        update: {},
      });

      this.logger.log(`Created default admin account: 'admin' / 'admin123' (ID: ${admin.id})`);
    }
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
      create: { username: dto.username, balance: 1000 },
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

    if (!admin) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, admin.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const user = await this.prisma.user.upsert({
      where: { username: admin.username },
      create: { username: admin.username, balance: 1000 },
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
}
