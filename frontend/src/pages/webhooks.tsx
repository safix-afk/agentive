import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import ApiKeyForm from '../components/ApiKeyForm';
import { endpoints, useApiKey } from '../utils/api';

interface Webhook {
  id: string;
  botId: string;
  url: string;
  eventType: string;
  description: string;
  createdAt: string;
}

const Webhooks: NextPage = () => {
  const { hasCredentials, getBotId } = useApiKey();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [url, setUrl] = useState<string>('');
  const [eventType, setEventType] = useState<string>('all');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const [isTesting, setIsTesting] = useState<Record<string, boolean>>({});

  // Event types
  const eventTypes = [
    { value: 'all', label: 'All Events' },
    { value: 'purchase', label: 'Purchase Events' },
    { value: 'usage', label: 'Usage Events' },
    { value: 'bot', label: 'Bot Events' },
  ];

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    if (!hasCredentials()) return;

    setIsLoading(true);
    setError(null);

    try {
      const botId = getBotId();
      const response = await endpoints.getWebhooks(botId);
      setWebhooks(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Failed to fetch webhooks. Please try again.'
      );
      console.error('Webhooks fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!hasCredentials()) {
      setError('Please enter your API credentials first');
      return;
    }

    if (!url.trim()) {
      setError('Webhook URL is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const botId = getBotId();
      await endpoints.registerWebhook({
        botId,
        url,
        eventType,
        description,
      });

      setSuccess('Webhook registered successfully');
      setUrl('');
      setDescription('');
      setEventType('all');
      
      // Refresh webhooks list
      fetchWebhooks();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Failed to register webhook. Please try again.'
      );
      console.error('Webhook registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (webhookId: string) => {
    setError(null);
    setSuccess(null);
    
    setIsDeleting(prev => ({ ...prev, [webhookId]: true }));

    try {
      await endpoints.deleteWebhook(webhookId);
      
      setSuccess('Webhook deleted successfully');
      
      // Update webhooks list
      setWebhooks(prev => prev.filter(webhook => webhook.id !== webhookId));
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Failed to delete webhook. Please try again.'
      );
      console.error('Webhook deletion error:', err);
    } finally {
      setIsDeleting(prev => ({ ...prev, [webhookId]: false }));
    }
  };

  const handleTest = async (webhookId: string, eventType: string) => {
    setError(null);
    setSuccess(null);
    
    setIsTesting(prev => ({ ...prev, [webhookId]: true }));

    try {
      await endpoints.testWebhook(webhookId, eventType);
      
      setSuccess('Test event sent successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Failed to send test event. Please try again.'
      );
      console.error('Webhook test error:', err);
    } finally {
      setIsTesting(prev => ({ ...prev, [webhookId]: false }));
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Layout
      title="Webhooks - Agentive"
      description="Manage webhook subscriptions for your Agentive account"
    >
      <div className="container-custom py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-8">Webhooks</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* Webhook Registration Form */}
              <Card title="Register Webhook" id="webhook-form" className="mb-8">
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Webhook URL
                    </label>
                    <input
                      id="url"
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="input"
                      placeholder="https://your-server.com/webhook"
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Event Type
                    </label>
                    <select
                      id="eventType"
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="input"
                    >
                      {eventTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description (Optional)
                    </label>
                    <input
                      id="description"
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="input"
                      placeholder="Describe the purpose of this webhook"
                    />
                  </div>

                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    disabled={!hasCredentials() || !url.trim()}
                    fullWidth
                  >
                    Register Webhook
                  </Button>

                  {error && (
                    <motion.div
                      className="mt-4 p-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      {error}
                    </motion.div>
                  )}

                  {success && (
                    <motion.div
                      className="mt-4 p-3 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      {success}
                    </motion.div>
                  )}
                </form>
              </Card>

              {/* Registered Webhooks */}
              <Card title="Registered Webhooks">
                {!hasCredentials() ? (
                  <p className="text-gray-500 dark:text-gray-400">
                    Please enter your API credentials to view your webhooks.
                  </p>
                ) : isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
                        <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : webhooks.length > 0 ? (
                  <div className="space-y-4">
                    {webhooks.map((webhook) => (
                      <motion.div
                        key={webhook.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                          <div>
                            <h4 className="font-medium mb-1 break-all">{webhook.url}</h4>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <span className="badge badge-primary">
                                {webhook.eventType.toUpperCase()}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                Created: {formatDate(webhook.createdAt)}
                              </span>
                            </div>
                            {webhook.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {webhook.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              isLoading={isTesting[webhook.id]}
                              onClick={() => handleTest(webhook.id, webhook.eventType)}
                            >
                              Test
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              isLoading={isDeleting[webhook.id]}
                              onClick={() => handleDelete(webhook.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    You haven't registered any webhooks yet.
                  </p>
                )}
              </Card>
            </div>

            <div>
              {/* API Credentials */}
              {!hasCredentials() ? (
                <ApiKeyForm className="mb-8" />
              ) : null}

              {/* Webhook Information */}
              <Card title="About Webhooks" className="mb-8">
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    Webhooks allow your application to receive real-time notifications when events occur in your Agentive account.
                  </p>
                  
                  <div>
                    <h4 className="font-medium mb-1">Event Types</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                      <li>
                        <span className="font-medium">All Events</span>: Receive notifications for all event types
                      </li>
                      <li>
                        <span className="font-medium">Purchase Events</span>: Credit purchases and invoice updates
                      </li>
                      <li>
                        <span className="font-medium">Usage Events</span>: API usage and credit consumption
                      </li>
                      <li>
                        <span className="font-medium">Bot Events</span>: Bot creation, updates, and status changes
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Security</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      All webhook requests include an HMAC signature in the <code>X-Agentive-Signature</code> header for verification.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Webhook Example */}
              <Card title="Example Webhook Payload">
                <div className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                  <pre>
{`{
  "event": "purchase.completed",
  "botId": "bot_1234567890",
  "data": {
    "invoiceId": "inv_9876543210",
    "amount": 1000,
    "totalPrice": 1.00,
    "timestamp": "2025-04-22T14:04:45Z"
  }
}`}
                  </pre>
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Webhooks;
