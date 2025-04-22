#!/usr/bin/env node

const { program } = require('commander');
const axios = require('axios');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const Table = require('cli-table3');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Config file path
const CONFIG_PATH = path.join(os.homedir(), '.agent-api-config.json');

// Default config
let config = {
  apiKey: '',
  baseUrl: 'http://localhost:3000/v1',
  sandboxMode: false
};

// Load config if exists
if (fs.existsSync(CONFIG_PATH)) {
  try {
    config = { ...config, ...JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) };
  } catch (error) {
    console.error(chalk.red('Error loading config file:'), error.message);
  }
}

// Save config
const saveConfig = () => {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error(chalk.red('Error saving config file:'), error.message);
  }
};

// Create API client
const createApiClient = () => {
  const baseURL = config.sandboxMode 
    ? `${config.baseUrl.replace('/v1', '/sandbox/v1')}` 
    : config.baseUrl;
  
  const headers = {};
  if (config.apiKey && !config.sandboxMode) {
    headers['X-API-Key'] = config.apiKey;
  }
  
  return axios.create({
    baseURL,
    headers,
    timeout: 10000
  });
};

// Format response
const formatResponse = (data) => {
  console.log(chalk.green('\nResponse:'));
  console.log(JSON.stringify(data, null, 2));
};

// Program setup
program
  .name('agent-cli')
  .description('CLI tool for Agent API Platform')
  .version('1.0.0');

// Configure command
program
  .command('config')
  .description('Configure CLI settings')
  .action(async () => {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiKey',
        message: 'Enter your API key:',
        default: config.apiKey
      },
      {
        type: 'input',
        name: 'baseUrl',
        message: 'Enter API base URL:',
        default: config.baseUrl
      },
      {
        type: 'confirm',
        name: 'sandboxMode',
        message: 'Use sandbox mode?',
        default: config.sandboxMode
      }
    ]);
    
    config = { ...config, ...answers };
    saveConfig();
    
    console.log(chalk.green('Configuration saved successfully!'));
  });

// Purchase credits command
program
  .command('purchase')
  .description('Purchase credits')
  .requiredOption('--amount <number>', 'Amount of credits to purchase')
  .option('--payment-method <id>', 'Stripe payment method ID')
  .action(async (options) => {
    const spinner = ora('Purchasing credits...').start();
    
    try {
      const api = createApiClient();
      const response = await api.post('/purchase-credits', {
        amount: parseInt(options.amount),
        paymentMethodId: options.paymentMethod
      });
      
      spinner.succeed('Credits purchased successfully!');
      formatResponse(response.data);
    } catch (error) {
      spinner.fail('Failed to purchase credits');
      console.error(chalk.red('Error:'), error.response?.data || error.message);
    }
  });

// Get usage command
program
  .command('usage')
  .description('Get usage statistics')
  .action(async () => {
    const spinner = ora('Fetching usage statistics...').start();
    
    try {
      const api = createApiClient();
      const response = await api.get('/usage');
      
      spinner.succeed('Usage statistics retrieved successfully!');
      
      // Format usage data in a table
      const table = new Table({
        head: [
          chalk.cyan('Credits Remaining'),
          chalk.cyan('Credits Used Today'),
          chalk.cyan('Daily Limit'),
          chalk.cyan('Reset Date')
        ]
      });
      
      table.push([
        response.data.creditsRemaining,
        response.data.creditsUsedToday,
        response.data.dailyLimit,
        new Date(response.data.resetDate).toLocaleString()
      ]);
      
      console.log(table.toString());
      
      // Show more details if available
      if (response.data.last30Days) {
        console.log(chalk.green('\nLast 30 Days:'));
        console.log(`Total Requests: ${response.data.last30Days.totalRequests}`);
        console.log(`Success Rate: ${(response.data.last30Days.successRate * 100).toFixed(2)}%`);
        console.log(`Total Credits Used: ${response.data.last30Days.totalCreditsUsed}`);
      }
    } catch (error) {
      spinner.fail('Failed to fetch usage statistics');
      console.error(chalk.red('Error:'), error.response?.data || error.message);
    }
  });

// Register webhook command
program
  .command('webhook:register')
  .description('Register a webhook URL')
  .requiredOption('--url <url>', 'Webhook URL')
  .option('--event <event>', 'Event type (all, purchase, usage, credit_update, error)', 'all')
  .option('--description <description>', 'Webhook description')
  .action(async (options) => {
    const spinner = ora('Registering webhook...').start();
    
    try {
      const api = createApiClient();
      const response = await api.post('/webhooks', {
        url: options.url,
        eventType: options.event,
        description: options.description
      });
      
      spinner.succeed('Webhook registered successfully!');
      formatResponse(response.data);
    } catch (error) {
      spinner.fail('Failed to register webhook');
      console.error(chalk.red('Error:'), error.response?.data || error.message);
    }
  });

// List webhooks command
program
  .command('webhook:list')
  .description('List registered webhooks')
  .action(async () => {
    const spinner = ora('Fetching webhooks...').start();
    
    try {
      const api = createApiClient();
      const response = await api.get('/webhooks');
      
      spinner.succeed('Webhooks retrieved successfully!');
      
      if (response.data.webhooks.length === 0) {
        console.log(chalk.yellow('No webhooks registered.'));
        return;
      }
      
      // Format webhooks in a table
      const table = new Table({
        head: [
          chalk.cyan('ID'),
          chalk.cyan('URL'),
          chalk.cyan('Event Type'),
          chalk.cyan('Status'),
          chalk.cyan('Last Triggered')
        ]
      });
      
      response.data.webhooks.forEach(webhook => {
        table.push([
          webhook.id,
          webhook.url,
          webhook.eventType,
          webhook.isActive ? chalk.green('Active') : chalk.red('Inactive'),
          webhook.lastTriggeredAt 
            ? new Date(webhook.lastTriggeredAt).toLocaleString() 
            : 'Never'
        ]);
      });
      
      console.log(table.toString());
    } catch (error) {
      spinner.fail('Failed to fetch webhooks');
      console.error(chalk.red('Error:'), error.response?.data || error.message);
    }
  });

// Test webhook command
program
  .command('webhook:test')
  .description('Test a webhook')
  .requiredOption('--id <id>', 'Webhook ID')
  .action(async (options) => {
    const spinner = ora('Testing webhook...').start();
    
    try {
      const api = createApiClient();
      const response = await api.post(`/webhooks/${options.id}/test`);
      
      spinner.succeed('Webhook tested successfully!');
      formatResponse(response.data);
    } catch (error) {
      spinner.fail('Failed to test webhook');
      console.error(chalk.red('Error:'), error.response?.data || error.message);
    }
  });

// Delete webhook command
program
  .command('webhook:delete')
  .description('Delete a webhook')
  .requiredOption('--id <id>', 'Webhook ID')
  .action(async (options) => {
    const spinner = ora('Deleting webhook...').start();
    
    try {
      const api = createApiClient();
      const response = await api.delete(`/webhooks/${options.id}`);
      
      spinner.succeed('Webhook deleted successfully!');
      formatResponse(response.data);
    } catch (error) {
      spinner.fail('Failed to delete webhook');
      console.error(chalk.red('Error:'), error.response?.data || error.message);
    }
  });

// Get bot info command
program
  .command('bot:info')
  .description('Get bot information')
  .action(async () => {
    const spinner = ora('Fetching bot information...').start();
    
    try {
      const api = createApiClient();
      const response = await api.get('/bot');
      
      spinner.succeed('Bot information retrieved successfully!');
      formatResponse(response.data);
    } catch (error) {
      spinner.fail('Failed to fetch bot information');
      console.error(chalk.red('Error:'), error.response?.data || error.message);
    }
  });

// Create bot command
program
  .command('bot:create')
  .description('Create a new bot')
  .requiredOption('--name <name>', 'Bot name')
  .option('--tier <tier>', 'Bot tier (free, premium, enterprise)', 'free')
  .action(async (options) => {
    const spinner = ora('Creating bot...').start();
    
    try {
      const api = createApiClient();
      const response = await api.post('/bot', {
        name: options.name,
        tier: options.tier
      });
      
      spinner.succeed('Bot created successfully!');
      formatResponse(response.data);
      
      // Save API key to config if not in sandbox mode
      if (!config.sandboxMode && response.data.bot.apiKey) {
        config.apiKey = response.data.bot.apiKey;
        saveConfig();
        console.log(chalk.green('API key saved to config!'));
      }
    } catch (error) {
      spinner.fail('Failed to create bot');
      console.error(chalk.red('Error:'), error.response?.data || error.message);
    }
  });

// Rotate API key command
program
  .command('bot:rotate-key')
  .description('Rotate API key')
  .action(async () => {
    const spinner = ora('Rotating API key...').start();
    
    try {
      const api = createApiClient();
      const response = await api.post('/bot/rotate-api-key');
      
      spinner.succeed('API key rotated successfully!');
      formatResponse(response.data);
      
      // Save new API key to config
      if (response.data.apiKey) {
        config.apiKey = response.data.apiKey;
        saveConfig();
        console.log(chalk.green('New API key saved to config!'));
      }
    } catch (error) {
      spinner.fail('Failed to rotate API key');
      console.error(chalk.red('Error:'), error.response?.data || error.message);
    }
  });

// Update bot tier command
program
  .command('bot:update-tier')
  .description('Update bot tier')
  .requiredOption('--tier <tier>', 'Bot tier (free, premium, enterprise)')
  .action(async (options) => {
    const spinner = ora('Updating bot tier...').start();
    
    try {
      const api = createApiClient();
      const response = await api.put('/bot/tier', {
        tier: options.tier
      });
      
      spinner.succeed('Bot tier updated successfully!');
      formatResponse(response.data);
    } catch (error) {
      spinner.fail('Failed to update bot tier');
      console.error(chalk.red('Error:'), error.response?.data || error.message);
    }
  });

// Toggle sandbox mode command
program
  .command('sandbox')
  .description('Toggle sandbox mode')
  .action(async () => {
    config.sandboxMode = !config.sandboxMode;
    saveConfig();
    
    console.log(chalk.green(`Sandbox mode ${config.sandboxMode ? 'enabled' : 'disabled'}!`));
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
