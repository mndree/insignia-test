import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({ example: 'alice', description: 'Unique username for registration' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiPropertyOptional({ example: 'password123', description: 'Account password' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ example: 'Alice Morgan', description: 'Full Name' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: '15/05/1996', description: 'Date of Birth' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'alice@example.com', description: 'Email address' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: '+62 812 3456 7890', description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Jakarta, Indonesia', description: 'Address' })
  @IsOptional()
  @IsString()
  address?: string;
}
