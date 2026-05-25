import { IsBooleanString, IsEnum, IsOptional, IsString } from 'class-validator';

export class ListConversationsQueryDto {
  @IsOptional() @IsString() channelId?: string;
  @IsOptional() @IsString() assignedAgentId?: string;
  @IsOptional() @IsEnum(['open', 'pending', 'closed']) status?: 'open' | 'pending' | 'closed';
  @IsOptional() @IsBooleanString() unreadOnly?: string;
  @IsOptional() @IsString() keyword?: string;
  @IsOptional() @IsString() tagId?: string;
  @IsOptional() @IsString() cursor?: string;
  @IsOptional() @IsString() limit?: string;
}

export class AssignDto {
  @IsString() agentId!: string;
}

export class AddTagDto {
  @IsString() tagId!: string;
}
