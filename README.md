# Agent API Platform

An agent-first API platform that serves as a "Stripe for bots" or "Twilio for AI agents." This platform provides authentication, credit management, rate limiting, and webhook capabilities for AI agents.

## Features

- **API Key Authentication**: Secure API access with API keys
- **Credit Management**: Purchase and track API usage credits
- **Rate Limiting**: Tier-based rate limits (free: 100 req/day, premium: 10,000 req/day)
- **Webhook Support**: Register webhook URLs and receive event notifications
- **Sandbox Environment**: Test API functionality without authentication
- **OpenAPI Documentation**: Interactive Swagger UI documentation

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

4. Start the server:

```bash
npm start
```

The server will be running at http://localhost:3000.

## API Documentation

Interactive API documentation is available at http://localhost:3000/docs when the server is running.

## Core Endpoints

### Authentication

All API requests (except sandbox endpoints) require an API key to be provided in the `X-API-Key` header.

Example:
```
X-API-Key: bot_free_test_key
```

### Purchase Credits

```
POST /purchase-credits
```

Request body:
```json
{
  "amount": 1000
}
```

Response:
```json
{
  "success": true,
  "creditsRemaining": 1100,
  "invoiceUrl": "http://localhost:3000/invoices/abc123",
  "invoice": {
    "id": "abc123",
    "botId": "bot-id",
    "botName": "Test Bot",
    "date": "2023-09-15T12:34:56.789Z",
    "amount": 1000,
    "pricePerCredit": 0.001,
    "totalPrice": 1,
    "currency": "USD",
    "status": "paid",
    "invoiceUrl": "http://localhost:3000/invoices/abc123"
  }
}
```

### Get Usage Statistics

```
GET /usage
```

Response:
```json
{
  "botId": "bot-id",
  "tier": "free",
  "creditsUsedToday": 45,
  "creditsRemaining": 55,
  "dailyLimit": 100,
  "resetDate": "2023-09-16T00:00:00.000Z"
}
```

### Register Webhook URL

```
POST /webhooks/:botId
```

Request body:
```json
{
  "url": "https://example.com/webhook"
}
```

Response:
```json
{
  "success": true,
  "message": "Webhook URL registered successfully",
  "webhookUrl": "https://example.com/webhook"
}
```

### Test Webhook

```
POST /webhooks/:botId/test
```

Response:
```json
{
  "success": true,
  "message": "Test webhook sent successfully",
  "webhookResponse": {
    // Response from your webhook endpoint
  }
}
```

## Sandbox Environment

The sandbox environment allows you to test API functionality without authentication or rate limits.

All sandbox endpoints are available under the `/sandbox` prefix:

- `POST /sandbox/purchase-credits`
- `GET /sandbox/usage`
- `POST /sandbox/webhooks/:botId`
- `POST /sandbox/webhooks/:botId/test`

## Testing with cURL

### Test the Sandbox Environment

```bash
# Purchase credits in sandbox
curl -X POST http://localhost:3000/sandbox/purchase-credits \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000}'

# Get usage statistics in sandbox
curl -X GET http://localhost:3000/sandbox/usage

# Register webhook URL in sandbox
curl -X POST http://localhost:3000/sandbox/webhooks/test-bot \
  -H "Content-Type: application/json" \
  -d '{"url": "https://webhook.site/your-webhook-id"}'

# Test webhook in sandbox
curl -X POST http://localhost:3000/sandbox/webhooks/test-bot/test
```

### Test the Production Environment

```bash
# Purchase credits
curl -X POST http://localhost:3000/purchase-credits \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bot_free_test_key" \
  -d '{"amount": 1000}'

# Get usage statistics
curl -X GET http://localhost:3000/usage \
  -H "X-API-Key: bot_free_test_key"

# Register webhook URL
curl -X POST http://localhost:3000/webhooks/test-bot-id \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bot_free_test_key" \
  -d '{"url": "https://webhook.site/your-webhook-id"}'

# Test webhook
curl -X POST http://localhost:3000/webhooks/test-bot-id/test \
  -H "X-API-Key: bot_free_test_key"
```

## Development

### Available Scripts

- `npm run build` - Build the TypeScript project
- `npm start` - Start the server
- `npm run dev` - Start the server with hot-reloading
- `npm test` - Run tests
- `npm run lint` - Run linting
- `npm run format` - Format code with Prettier

## Project Structure

```
src/
  controllers/
    purchaseController.ts - Credit purchase operations
    usageController.ts - Usage tracking and reporting
    webhookController.ts - Webhook registration and testing
  middleware/
    authMiddleware.ts - API key authentication
    rateLimitMiddleware.ts - Rate limiting and quota tracking
  routes/
    purchaseRoutes.ts - Routes for credit purchases
    usageRoutes.ts - Routes for usage statistics
    webhookRoutes.ts - Routes for webhook management
    sandboxRoutes.ts - Sandbox routes for testing
  utils/
    credentialStore.ts - In-memory store for bot credentials
    invoiceGenerator.ts - Invoice generation for purchases
    webhookHandler.ts - Webhook delivery management
    swagger.ts - OpenAPI/Swagger configuration
  server.ts - Main application entry point
```

## License

MIT
