import { ApiProperty } from '@nestjs/swagger';

export class AdminProfileDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'admin' })
  username: string;
}

export class AdminUserDto {
  @ApiProperty({ example: 'admin' })
  username: string;
}

export class AdminLoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'Admin JWT Bearer Token' })
  token: string;

  @ApiProperty({ type: AdminProfileDto })
  admin: AdminProfileDto;

  @ApiProperty({ type: AdminUserDto, required: false })
  user?: AdminUserDto;
}
