import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AdminRegisterDto {
  @ApiProperty({ example: 'admin', description: 'Admin username' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'admin123', description: 'Admin password (min 6 chars)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
