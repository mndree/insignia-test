import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({ example: 'alice', description: 'Unique username for registration' })
  @IsString()
  @IsNotEmpty()
  username: string;
}
