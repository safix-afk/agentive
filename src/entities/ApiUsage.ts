import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { IsNotEmpty, IsString } from "class-validator";
import { BotCredential } from "./BotCredential";

@Entity()
@Index(["botId", "date"])
export class ApiUsage {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  @IsNotEmpty()
  botId: string;

  @Column({ type: "date" })
  @Index()
  date: Date;

  @Column({ type: "int", default: 0 })
  requestCount: number;

  @Column({ type: "int", default: 0 })
  successCount: number;

  @Column({ type: "int", default: 0 })
  errorCount: number;

  @Column({ type: "int", default: 0 })
  creditsUsed: number;

  @Column({ type: "jsonb", nullable: true })
  endpointBreakdown: Record<string, number>;

  @Column({ type: "jsonb", nullable: true })
  errorBreakdown: Record<string, number>;

  @Column({ nullable: true })
  @IsString()
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @ManyToOne(() => BotCredential, bot => bot.usageRecords)
  @JoinColumn({ name: "botId" })
  bot: BotCredential;
}
