import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1650000000000 implements MigrationInterface {
    name = 'InitialSchema1650000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum types
        await queryRunner.query(`CREATE TYPE "public"."bot_credential_tier_enum" AS ENUM('free', 'premium', 'enterprise')`);
        await queryRunner.query(`CREATE TYPE "public"."invoice_status_enum" AS ENUM('pending', 'paid', 'failed', 'refunded')`);
        await queryRunner.query(`CREATE TYPE "public"."invoice_payment_provider_enum" AS ENUM('stripe', 'manual')`);
        await queryRunner.query(`CREATE TYPE "public"."webhook_subscription_event_type_enum" AS ENUM('all', 'purchase', 'usage', 'credit_update', 'error')`);

        // Create BotCredential table
        await queryRunner.query(`CREATE TABLE "bot_credential" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
            "apiKey" character varying NOT NULL, 
            "apiKeyHash" character varying, 
            "name" character varying NOT NULL, 
            "tier" "public"."bot_credential_tier_enum" NOT NULL DEFAULT 'free', 
            "isActive" boolean NOT NULL DEFAULT true, 
            "stripeCustomerId" character varying, 
            "hmacSecret" character varying, 
            "lastLoginAt" TIMESTAMP, 
            "lastApiKeyRotatedAt" TIMESTAMP, 
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
            "creditBalanceId" uuid, 
            CONSTRAINT "UQ_bot_credential_apiKey" UNIQUE ("apiKey"), 
            CONSTRAINT "REL_bot_credential_creditBalanceId" UNIQUE ("creditBalanceId"), 
            CONSTRAINT "PK_bot_credential" PRIMARY KEY ("id")
        )`);

        // Create CreditBalance table
        await queryRunner.query(`CREATE TABLE "credit_balance" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
            "botId" character varying NOT NULL, 
            "creditsRemaining" integer NOT NULL DEFAULT 0, 
            "totalCreditsPurchased" integer NOT NULL DEFAULT 0, 
            "totalCreditsUsed" integer NOT NULL DEFAULT 0, 
            "usageToday" integer NOT NULL DEFAULT 0, 
            "resetDate" TIMESTAMP NOT NULL, 
            "dailyLimit" integer NOT NULL DEFAULT 100, 
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
            CONSTRAINT "PK_credit_balance" PRIMARY KEY ("id")
        )`);

        // Create Invoice table
        await queryRunner.query(`CREATE TABLE "invoice" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
            "botId" character varying NOT NULL, 
            "stripePaymentIntentId" character varying, 
            "stripeCustomerId" character varying, 
            "amount" integer NOT NULL, 
            "pricePerCredit" numeric(10,6) NOT NULL DEFAULT 0.001, 
            "totalPrice" numeric(10,2) NOT NULL, 
            "currency" character varying NOT NULL DEFAULT 'USD', 
            "status" "public"."invoice_status_enum" NOT NULL DEFAULT 'pending', 
            "paymentProvider" "public"."invoice_payment_provider_enum" NOT NULL DEFAULT 'stripe', 
            "receiptUrl" character varying, 
            "invoiceUrl" character varying, 
            "notes" character varying, 
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
            CONSTRAINT "PK_invoice" PRIMARY KEY ("id")
        )`);

        // Create WebhookSubscription table
        await queryRunner.query(`CREATE TABLE "webhook_subscription" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
            "botId" character varying NOT NULL, 
            "url" character varying NOT NULL, 
            "eventType" "public"."webhook_subscription_event_type_enum" NOT NULL DEFAULT 'all', 
            "isActive" boolean NOT NULL DEFAULT true, 
            "description" character varying, 
            "failureCount" integer NOT NULL DEFAULT 0, 
            "lastTriggeredAt" TIMESTAMP, 
            "lastFailureAt" TIMESTAMP, 
            "lastFailureMessage" character varying, 
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
            CONSTRAINT "PK_webhook_subscription" PRIMARY KEY ("id")
        )`);

        // Create ApiUsage table
        await queryRunner.query(`CREATE TABLE "api_usage" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
            "botId" character varying NOT NULL, 
            "date" date NOT NULL, 
            "requestCount" integer NOT NULL DEFAULT 0, 
            "successCount" integer NOT NULL DEFAULT 0, 
            "errorCount" integer NOT NULL DEFAULT 0, 
            "creditsUsed" integer NOT NULL DEFAULT 0, 
            "endpointBreakdown" jsonb, 
            "errorBreakdown" jsonb, 
            "notes" character varying, 
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
            CONSTRAINT "PK_api_usage" PRIMARY KEY ("id")
        )`);

        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_api_usage_botId_date" ON "api_usage" ("botId", "date") `);
        await queryRunner.query(`CREATE INDEX "IDX_api_usage_date" ON "api_usage" ("date") `);

        // Add foreign key constraints
        await queryRunner.query(`ALTER TABLE "bot_credential" ADD CONSTRAINT "FK_bot_credential_creditBalanceId" FOREIGN KEY ("creditBalanceId") REFERENCES "credit_balance"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice" ADD CONSTRAINT "FK_invoice_botId" FOREIGN KEY ("botId") REFERENCES "bot_credential"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "webhook_subscription" ADD CONSTRAINT "FK_webhook_subscription_botId" FOREIGN KEY ("botId") REFERENCES "bot_credential"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "api_usage" ADD CONSTRAINT "FK_api_usage_botId" FOREIGN KEY ("botId") REFERENCES "bot_credential"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "api_usage" DROP CONSTRAINT "FK_api_usage_botId"`);
        await queryRunner.query(`ALTER TABLE "webhook_subscription" DROP CONSTRAINT "FK_webhook_subscription_botId"`);
        await queryRunner.query(`ALTER TABLE "invoice" DROP CONSTRAINT "FK_invoice_botId"`);
        await queryRunner.query(`ALTER TABLE "bot_credential" DROP CONSTRAINT "FK_bot_credential_creditBalanceId"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "public"."IDX_api_usage_date"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_api_usage_botId_date"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "api_usage"`);
        await queryRunner.query(`DROP TABLE "webhook_subscription"`);
        await queryRunner.query(`DROP TABLE "invoice"`);
        await queryRunner.query(`DROP TABLE "credit_balance"`);
        await queryRunner.query(`DROP TABLE "bot_credential"`);

        // Drop enum types
        await queryRunner.query(`DROP TYPE "public"."webhook_subscription_event_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."invoice_payment_provider_enum"`);
        await queryRunner.query(`DROP TYPE "public"."invoice_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."bot_credential_tier_enum"`);
    }
}
