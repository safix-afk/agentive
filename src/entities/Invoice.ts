import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from "class-validator";
import { BotCredential } from "./BotCredential";

export enum InvoiceStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded"
}

export enum PaymentProvider {
  STRIPE = "stripe",
  MANUAL = "manual"
}

@Entity()
export class Invoice {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  @IsNotEmpty()
  botId: string;

  @Column({ nullable: true })
  stripePaymentIntentId: string;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ type: "int" })
  @IsNumber()
  @Min(1)
  amount: number;

  @Column({ type: "decimal", precision: 10, scale: 6, default: 0.001 })
  pricePerCredit: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ default: "USD" })
  @IsString()
  currency: string;

  @Column({
    type: "enum",
    enum: InvoiceStatus,
    default: InvoiceStatus.PENDING
  })
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;

  @Column({
    type: "enum",
    enum: PaymentProvider,
    default: PaymentProvider.STRIPE
  })
  @IsEnum(PaymentProvider)
  paymentProvider: PaymentProvider;

  @Column({ nullable: true })
  receiptUrl: string;

  @Column({ nullable: true })
  invoiceUrl: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => BotCredential, bot => bot.invoices)
  @JoinColumn({ name: "botId" })
  bot: BotCredential;
}
