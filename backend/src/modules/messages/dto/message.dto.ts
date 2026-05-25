import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString() conversationId!: string;
  @IsEnum(['text', 'image']) messageType!: 'text' | 'image';
  @IsOptional() @IsString() @MinLength(1) text?: string;
  @IsOptional() @IsString() attachmentId?: string;
}

export class ListMessagesQueryDto {
  @IsOptional() @IsString() cursor?: string;
  @IsOptional() @IsString() limit?: string;
}
