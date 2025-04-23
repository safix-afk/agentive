import { gql } from 'apollo-server-core';

// Define the GraphQL schema
export const typeDefs = gql`
  # Invoice type for purchase transactions
  type Invoice {
    id: ID!
    botId: String!
    amount: Float!
    credits: Int!
    status: String!
    createdAt: String!
  }

  # Usage statistics type
  type UsageStats {
    daily: [DailyUsage!]!
    total: TotalUsage!
  }

  type DailyUsage {
    date: String!
    requests: Int!
    tokens: Int!
    credits: Int!
  }

  type TotalUsage {
    requests: Int!
    tokens: Int!
    credits: Int!
  }

  # Webhook subscription type
  type WebhookSubscription {
    id: ID!
    url: String!
    events: [String!]!
    createdAt: String!
  }

  # Bot information type
  type Bot {
    id: ID!
    name: String!
    tier: String!
    creditsRemaining: Int!
    usageToday: Int!
    createdAt: String!
  }

  # Transaction response type
  type TransactionResponse {
    success: Boolean!
    transaction: Invoice
    error: String
  }

  # Usage response type
  type UsageResponse {
    success: Boolean!
    usage: UsageStats
    error: String
  }

  # Webhook response type
  type WebhookResponse {
    success: Boolean!
    webhooks: [WebhookSubscription!]
    webhook: WebhookSubscription
    error: String
  }

  # Bot response type
  type BotResponse {
    success: Boolean!
    bot: Bot
    error: String
  }

  # Test webhook response
  type TestWebhookResponse {
    success: Boolean!
    message: String
    error: String
  }

  # Input for purchasing credits
  input PurchaseCreditsInput {
    botId: String!
    amount: Int!
  }

  # Input for creating a webhook
  input CreateWebhookInput {
    url: String!
    events: [String!]!
  }

  # Input for testing a webhook
  input TestWebhookInput {
    webhookId: ID!
    event: String!
    payload: String
  }

  # Query type
  type Query {
    # Get bot information
    getBot(botId: String!): BotResponse!
    
    # Get usage statistics
    getUsage(botId: String!, period: String): UsageResponse!
    
    # Get webhook subscriptions
    getWebhooks(botId: String!): WebhookResponse!
  }

  # Mutation type
  type Mutation {
    # Purchase credits
    purchaseCredits(input: PurchaseCreditsInput!): TransactionResponse!
    
    # Create webhook subscription
    createWebhook(input: CreateWebhookInput!): WebhookResponse!
    
    # Delete webhook subscription
    deleteWebhook(webhookId: ID!): WebhookResponse!
    
    # Test webhook
    testWebhook(input: TestWebhookInput!): TestWebhookResponse!
  }
`;
