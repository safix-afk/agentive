/**
 * Swagger/OpenAPI configuration
 * Generates and serves API documentation
 */

import swaggerJSDoc from 'swagger-jsdoc';

const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Agent API Platform',
      version: '1.0.0',
      description: 'API platform for AI agents - "Stripe for bots"',
      contact: {
        name: 'API Support',
        email: 'support@agentapi.example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.agentapi.example.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
    },
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
    tags: [
      {
        name: 'Purchase',
        description: 'API credit purchase operations',
      },
      {
        name: 'Usage',
        description: 'API usage tracking operations',
      },
      {
        name: 'Webhook',
        description: 'Webhook registration and management',
      },
      {
        name: 'Sandbox',
        description: 'Sandbox environment for testing',
      },
    ],
  },
  // Path to the API docs
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
