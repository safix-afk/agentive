import "reflect-metadata";
import { DataSource } from "typeorm";
import { BotCredential } from "../entities/BotCredential";
import { Invoice } from "../entities/Invoice";
import { CreditBalance } from "../entities/CreditBalance";
import { WebhookSubscription } from "../entities/WebhookSubscription";
import { ApiUsage } from "../entities/ApiUsage";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create TypeORM data source
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "agent_api_platform",
  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV === "development",
  entities: [BotCredential, Invoice, CreditBalance, WebhookSubscription, ApiUsage],
  migrations: ["src/migrations/*.ts"],
  subscribers: [],
});

// Initialize data source
export const initializeDataSource = async (): Promise<DataSource> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("Data Source has been initialized!");
    }
    return AppDataSource;
  } catch (error) {
    console.error("Error during Data Source initialization:", error);
    throw error;
  }
};
