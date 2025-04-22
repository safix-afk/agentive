import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn } from "typeorm";
import { IsEnum, IsNotEmpty, IsString, Length } from "class-validator";
import { CreditBalance } from "./CreditBalance";
import { WebhookSubscription } from "./WebhookSubscription";
import { Invoice } from "./Invoice";
import { ApiUsage } from "./ApiUsage";

export enum BotTier {
  FREE = "free",
  PREMIUM = "premium",
  ENTERPRISE = "enterprise"
}

@Entity()
export class BotCredential {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  @IsNotEmpty()
  @IsString()
  @Length(5, 100)
  apiKey: string;

  @Column({ nullable: true })
  apiKeyHash: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  @Length(3, 100)
  name: string;

  @Column({
    type: "enum",
    enum: BotTier,
    default: BotTier.FREE
  })
  @IsEnum(BotTier)
  tier: BotTier;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ nullable: true })
  hmacSecret: string;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @Column({ nullable: true })
  lastApiKeyRotatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToOne(() => CreditBalance, creditBalance => creditBalance.bot, { cascade: true })
  @JoinColumn()
  creditBalance: CreditBalance;

  @OneToMany(() => WebhookSubscription, webhook => webhook.bot)
  webhooks: WebhookSubscription[];

  @OneToMany(() => Invoice, invoice => invoice.bot)
  invoices: Invoice[];

  @OneToMany(() => ApiUsage, usage => usage.bot)
  usageRecords: ApiUsage[];
}
