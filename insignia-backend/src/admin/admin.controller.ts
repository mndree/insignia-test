import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { AdminLoginDto } from './dto/admin-login.dto.js';
import { AdminRegisterDto } from './dto/admin-register.dto.js';
import { AdminLoginResponseDto } from './dto/admin-response.dto.js';

@ApiTags('Admin API')
@ApiBearerAuth('admin-token')
@ApiHeader({
  name: 'Authorization',
  description: 'Bearer token (e.g. "Bearer <token>" or direct token; can also be set via the Authorize button)',
  required: false,
})
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login to receive Admin Bearer Token' })
  @ApiResponse({
    status: 200,
    description: 'Admin authenticated successfully. Copy the token and paste into Authorize button.',
    type: AdminLoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid admin credentials' })
  login(@Body() dto: AdminLoginDto): Promise<AdminLoginResponseDto> {
    return this.adminService.login(dto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('admin-token')
  @ApiOperation({ summary: 'Register a new admin account' })
  @ApiResponse({
    status: 201,
    description: 'Admin registered successfully',
    type: AdminLoginResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Admin username already taken' })
  register(@Body() dto: AdminRegisterDto): Promise<AdminLoginResponseDto> {
    return this.adminService.register(dto);
  }
}
