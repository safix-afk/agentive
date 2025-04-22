import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import ApiKeyForm from '../components/ApiKeyForm';
import { useApiKey } from '../utils/api';

const Sandbox: NextPage = () => {
  const { setBotId, setApiKey, hasCredentials, clearCredentials } = useApiKey();
  const [sandboxMode, setSandboxMode] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Sandbox credentials
  const sandboxCredentials = {
    botId: 'bot_sandbox_123',
    apiKey: 'sk_sandbox_abcdefghijklmnopqrstuvwxyz123456',
  };

  // Example API requests
  const exampleRequests = [
    {
      title: 'Get Bot Information',
      method: 'GET',
      endpoint: '/bot/:botId',
      code: `curl -X GET "https://api.agentive.ai/v1/bot/${sandboxCredentials.botId}" \\
  -H "X-Bot-ID: ${sandboxCredentials.botId}" \\
  -H "X-API-Key: ${sandboxCredentials.apiKey}" \\
  -H "X-Sandbox-Mode: true"`,
    },
    {
      title: 'Purchase Credits',
      method: 'POST',
      endpoint: '/purchase-credits',
      code: `curl -X POST "https://api.agentive.ai/v1/purchase-credits" \\
  -H "X-Bot-ID: ${sandboxCredentials.botId}" \\
  -H "X-API-Key: ${sandboxCredentials.apiKey}" \\
  -H "Content-Type: application/json" \\
  -H "X-Sandbox-Mode: true" \\
  -d '{"botId": "${sandboxCredentials.botId}", "amount": 1000}'`,
    },
    {
      title: 'Get Usage Statistics',
      method: 'GET',
      endpoint: '/usage',
      code: `curl -X GET "https://api.agentive.ai/v1/usage?botId=${sandboxCredentials.botId}" \\
  -H "X-Bot-ID: ${sandboxCredentials.botId}" \\
  -H "X-API-Key: ${sandboxCredentials.apiKey}" \\
  -H "X-Sandbox-Mode: true"`,
    },
    {
      title: 'Register Webhook',
      method: 'POST',
      endpoint: '/webhooks/register',
      code: `curl -X POST "https://api.agentive.ai/v1/webhooks/register" \\
  -H "X-Bot-ID: ${sandboxCredentials.botId}" \\
  -H "X-API-Key: ${sandboxCredentials.apiKey}" \\
  -H "Content-Type: application/json" \\
  -H "X-Sandbox-Mode: true" \\
  -d '{"botId": "${sandboxCredentials.botId}", "url": "https://webhook.site/your-id", "eventType": "all"}'`,
    },
  ];

  useEffect(() => {
    // Check if sandbox mode is enabled in localStorage
    const savedSandboxMode = localStorage.getItem('agentive_sandbox_mode') === 'true';
    setSandboxMode(savedSandboxMode);
  }, []);

  const toggleSandboxMode = () => {
    const newMode = !sandboxMode;
    setSandboxMode(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agentive_sandbox_mode', newMode.toString());
    }
  };

  const enableSandbox = () => {
    // Set sandbox credentials and enable sandbox mode
    setBotId(sandboxCredentials.botId);
    setApiKey(sandboxCredentials.apiKey);
    setSandboxMode(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agentive_sandbox_mode', 'true');
    }
  };

  const disableSandbox = () => {
    // Clear credentials and disable sandbox mode
    clearCredentials();
    setSandboxMode(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agentive_sandbox_mode');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Layout
      title="Sandbox - Agentive"
      description="Test the Agentive API in a safe sandbox environment"
    >
      <div className="container-custom py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-8">Sandbox Environment</h1>

          {/* Sandbox Mode Toggle */}
          <Card className="mb-8" id="sandbox-toggle">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Sandbox Mode</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {sandboxMode
                    ? 'Sandbox mode is currently enabled. All API requests will use test data and will not affect production.'
                    : 'Sandbox mode is currently disabled. API requests will use live data.'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant={sandboxMode ? 'primary' : 'outline'}
                  onClick={toggleSandboxMode}
                >
                  {sandboxMode ? 'Disable Sandbox' : 'Enable Sandbox'}
                </Button>
                {!hasCredentials() && (
                  <Button variant="secondary" onClick={enableSandbox}>
                    Use Sandbox Credentials
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* API Request Examples */}
              <Card title="API Request Examples" className="mb-8">
                <div className="space-y-6">
                  {exampleRequests.map((request, index) => (
                    <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{request.title}</h4>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                          {request.method}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {request.endpoint}
                      </p>
                      <div className="relative">
                        <pre className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto">
                          {request.code}
                        </pre>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(request.code, `request-${index}`)}
                        >
                          {copied === `request-${index}` ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Response Examples */}
              <Card title="Example Responses">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">Get Bot Information Response</h4>
                    <div className="relative">
                      <pre className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto">
{`{
  "id": "${sandboxCredentials.botId}",
  "name": "Sandbox Test Bot",
  "tier": "PREMIUM",
  "status": "ACTIVE",
  "creditBalance": {
    "creditsRemaining": 10000,
    "dailyLimit": 1000,
    "resetDate": "2025-04-23T00:00:00Z"
  },
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-04-22T14:14:11Z"
}`}
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(`{
  "id": "${sandboxCredentials.botId}",
  "name": "Sandbox Test Bot",
  "tier": "PREMIUM",
  "status": "ACTIVE",
  "creditBalance": {
    "creditsRemaining": 10000,
    "dailyLimit": 1000,
    "resetDate": "2025-04-23T00:00:00Z"
  },
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-04-22T14:14:11Z"
}`, 'response-1')}
                      >
                        {copied === 'response-1' ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Purchase Credits Response</h4>
                    <div className="relative">
                      <pre className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto">
{`{
  "success": true,
  "invoiceId": "inv_sandbox_123456",
  "amount": 1000,
  "totalPrice": 1.00,
  "invoiceUrl": "/invoices/inv_sandbox_123456",
  "creditsRemaining": 11000
}`}
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(`{
  "success": true,
  "invoiceId": "inv_sandbox_123456",
  "amount": 1000,
  "totalPrice": 1.00,
  "invoiceUrl": "/invoices/inv_sandbox_123456",
  "creditsRemaining": 11000
}`, 'response-2')}
                      >
                        {copied === 'response-2' ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div>
              {/* Sandbox Credentials */}
              <Card title="Sandbox Credentials" className="mb-8">
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    Use these credentials to test the Agentive API in sandbox mode without affecting production data or credits.
                  </p>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Bot ID
                    </h4>
                    <div className="flex">
                      <input
                        type="text"
                        readOnly
                        value={sandboxCredentials.botId}
                        className="input font-mono text-sm"
                        aria-label="Sandbox Bot ID"
                        title="Sandbox Bot ID"
                        id="sandbox-bot-id"
                      />
                      <Button
                        variant="outline"
                        className="ml-2"
                        onClick={() => copyToClipboard(sandboxCredentials.botId, 'botId')}
                      >
                        {copied === 'botId' ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      API Key
                    </h4>
                    <div className="flex">
                      <input
                        type="text"
                        readOnly
                        value={sandboxCredentials.apiKey}
                        className="input font-mono text-sm"
                        aria-label="Sandbox API Key"
                        title="Sandbox API Key"
                        id="sandbox-api-key"
                      />
                      <Button
                        variant="outline"
                        className="ml-2"
                        onClick={() => copyToClipboard(sandboxCredentials.apiKey, 'apiKey')}
                      >
                        {copied === 'apiKey' ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={enableSandbox}
                    >
                      Use Sandbox Credentials
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Sandbox Information */}
              <Card title="About Sandbox Mode">
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    Sandbox mode allows you to test the Agentive API without using real credits or affecting production data.
                  </p>

                  <div>
                    <h4 className="font-medium mb-1">Features</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                      <li>Test API endpoints without using real credits</li>
                      <li>Simulate purchases without real payments</li>
                      <li>Test webhook integrations safely</li>
                      <li>Experiment with different API responses</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-1">Sandbox Header</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      When sandbox mode is enabled, all API requests include the <code>X-Sandbox-Mode: true</code> header.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Sandbox;
