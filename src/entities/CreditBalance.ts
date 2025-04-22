import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne } from "typeorm";
import { IsNotEmpty, IsNumber, Min } from "class-validator";
import { BotCredential } from "./BotCredential";

@Entity()
export class CreditBalance {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  @IsNotEmpty()
  botId: string;

  @Column({ type: "int", default: 0 })
  @IsNumber()
  @Min(0)
  creditsRemaining: number;

  @Column({ type: "int", default: 0 })
  @IsNumber()
  @Min(0)
  totalCreditsPurchased: number;

  @Column({ type: "int", default: 0 })
  @IsNumber()
  @Min(0)
  totalCreditsUsed: number;

  @Column({ type: "int", default: 0 })
  @IsNumber()
  @Min(0)
  usageToday: number;

  @Column()
  resetDate: Date;

  @Column({ type: "int", default: 100 })
  @IsNumber()
  @Min(0)
  dailyLimit: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToOne(() => BotCredential, bot => bot.creditBalance)
  bot: BotCredential;
}
