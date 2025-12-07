import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum } from 'class-validator';
import { MessageSenderRole } from '../schemas/order-message.schema';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsEnum(MessageSenderRole)
  @IsOptional()
  senderRole?: MessageSenderRole;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];

  @IsOptional()
  metadata?: Record<string, unknown>;
}
