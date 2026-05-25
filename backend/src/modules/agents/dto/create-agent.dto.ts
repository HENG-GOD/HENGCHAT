import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../../common/constants/roles.enum';

export class CreateAgentDto {
  @IsString() name!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsOptional() @IsEnum(Role) role?: Role;
}

export class UpdateAgentDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @IsString() @MinLength(8) password?: string;
}

export class UpdateAgentStatusDto {
  @IsString() status!: 'online' | 'offline';
}
