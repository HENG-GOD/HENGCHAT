import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateChannelDto {
  @IsString() @MinLength(1) name!: string;
  @IsString() channelId!: string;
  @IsString() channelSecret!: string;
  @IsString() channelAccessToken!: string;
  @IsOptional() @IsBoolean() webhookEnabled?: boolean;
}

export class UpdateChannelDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() channelSecret?: string;
  @IsOptional() @IsString() channelAccessToken?: string;
  @IsOptional() @IsBoolean() webhookEnabled?: boolean;
}

export class UpdateChannelStatusDto {
  @IsEnum(['active', 'disabled']) status!: 'active' | 'disabled';
}
