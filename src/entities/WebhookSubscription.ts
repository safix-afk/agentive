import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { IsEnum, IsNotEmpty, IsString, IsUrl } from "class-validator";
import { BotCredential } from "./BotCredential";

export enum WebhookEventType {
  ALL = "all",
  PURCHASE = "purchase",
  USAGE = "usage",
  CREDIT_UPDATE = "credit_update",
  ERROR = "error"
}

@Entity()
export class WebhookSubscription {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  @IsNotEmpty()
  botId: string;

  @Column()
  @IsNotEmpty()
  @IsUrl()
  url: string;

  @Column({ 
    type: "enum", 
    enum: WebhookEventType,
    default: WebhookEventType.ALL
  })
  @IsEnum(WebhookEventType)
  eventType: WebhookEventType;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  @IsString()
  description: string;

  @Column({ default: 0 })
  failureCount: number;

  @Column({ nullable: true })
  lastTriggeredAt: Date;

  @Column({ nullable: true })
  lastFailureAt: Date;

  @Column({ nullable: true })
  lastFailureMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => BotCredential, bot => bot.webhooks)
  @JoinColumn({ name: "botId" })
  bot: BotCredential;
}
