import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WalletController } from './wallet.controller.js';
import { WalletService } from './wallet.service.js';
import { AuthGuard } from '../auth/auth.guard.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'insignia-assignment-secret-key-2026'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [WalletController],
  providers: [WalletService, AuthGuard],
  exports: [WalletService],
})
export class WalletModule {}
