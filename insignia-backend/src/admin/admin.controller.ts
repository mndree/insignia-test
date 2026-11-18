import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
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
import { UsersQueryDto, UpdateUserDto, AdminTransferDto } from './dto/admin-user.dto.js';

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

  @Get('users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List and search users with wallet balance and metrics' })
  getUsers(@Query() query: UsersQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user details, biodata, balance, and recent transactions' })
  getUserDetails(@Param('id') id: string) {
    return this.adminService.getUserDetails(id);
  }

  @Patch('users/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user profile and status' })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Post('users/:id/transfer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin initiated transfer from user balance' })
  transferUserBalance(
    @Param('id') id: string,
    @Body() dto: AdminTransferDto,
  ) {
    return this.adminService.transferUserBalance(id, dto);
  }
}

@ApiTags('Auth API')
@Controller('auth')
export class AuthLoginController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login endpoint for users and administrators' })
  @ApiResponse({
    status: 200,
    description: 'User authenticated successfully',
    type: AdminLoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: AdminLoginDto): Promise<AdminLoginResponseDto> {
    return this.adminService.login(dto);
  }
}
