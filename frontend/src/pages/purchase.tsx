import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Card from '../components/Card';
import ApiKeyForm from '../components/ApiKeyForm';
import { endpoints, useApiKey } from '../utils/api';

const Purchase: NextPage = () => {
  const { hasCredentials, getBotId, getApiKey } = useApiKey();
  const [amount, setAmount] = useState<number>(1000);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);

  // Predefined credit packages
  const creditPackages = [
    { amount: 1000, price: '$1.00', popular: false },
    { amount: 5000, price: '$5.00', popular: true },
    { amount: 10000, price: '$10.00', popular: false },
    { amount: 50000, price: '$45.00', popular: false, discount: '10% off' },
  ];

  useEffect(() => {
    // Fetch bot info to display current credit balance
    const fetchBotInfo = async () => {
      if (hasCredentials()) {
        try {
          const botId = getBotId();
          const response = await endpoints.getBotInfo(botId);
          setRemainingCredits(response.data.creditBalance.creditsRemaining);
        } catch (err) {
          console.error('Failed to fetch bot info:', err);
        }
      }
    };

    fetchBotInfo();
  }, [hasCredentials, getBotId]);

  const handlePurchase = async () => {
    setError(null);
    setSuccess(false);
    setInvoiceUrl(null);

    if (!hasCredentials()) {
      setError('Please enter your API credentials first');
      return;
    }

    setIsLoading(true);

    try {
      const botId = getBotId();
      const response = await endpoints.purchaseCredits({
        botId,
        amount,
      });

      setSuccess(true);
      setInvoiceUrl(response.data.invoiceUrl);
      setRemainingCredits(response.data.creditsRemaining);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Failed to purchase credits. Please try again.'
      );
      console.error('Purchase error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setAmount(value);
    }
  };

  const selectPackage = (packageAmount: number) => {
    setAmount(packageAmount);
  };

  return (
    <Layout
      title="Purchase Credits - Agentive"
      description="Purchase API credits for your Agentive account"
    >
      <div className="container-custom py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-8">Purchase Credits</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* Credit Packages */}
              <Card title="Select Credit Package" className="mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {creditPackages.map((pkg) => (
                    <motion.div
                      key={pkg.amount}
                      className={`border rounded-lg p-4 cursor-pointer relative ${
                        amount === pkg.amount
                          ? 'border-primary-950 dark:border-primary-400 shadow-md'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectPackage(pkg.amount)}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-3 -right-3">
                          <span className="badge badge-primary">Popular</span>
                        </div>
                      )}
                      <div className="font-bold text-lg">{pkg.amount.toLocaleString()} Credits</div>
                      <div className="text-gray-600 dark:text-gray-300">{pkg.price}</div>
                      {pkg.discount && (
                        <div className="text-green-600 dark:text-green-400 text-sm mt-1">
                          {pkg.discount}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="mb-6">
                  <label htmlFor="customAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Or enter custom amount:
                  </label>
                  <input
                    id="customAmount"
                    type="number"
                    min="100"
                    value={amount}
                    onChange={handleAmountChange}
                    className="input"
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Estimated cost: ${(amount * 0.001).toFixed(2)}
                  </p>
                </div>

                <Button
                  onClick={handlePurchase}
                  isLoading={isLoading}
                  disabled={!hasCredentials() || amount <= 0}
                  fullWidth
                >
                  Purchase Credits
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
                    <p className="font-medium">Purchase successful!</p>
                    <p className="mt-1">
                      {amount.toLocaleString()} credits have been added to your account.
                    </p>
                    {invoiceUrl && (
                      <p className="mt-2">
                        <a
                          href={invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-950 dark:text-primary-400 hover:underline"
                        >
                          View Invoice
                        </a>
                      </p>
                    )}
                  </motion.div>
                )}
              </Card>

              {/* Pricing Information */}
              <Card title="Pricing Information">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-1">Credit Usage</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      Credits are consumed based on the API endpoints you use. Each API call costs a
                      specific number of credits depending on the complexity of the operation.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-1">Volume Discounts</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      Purchase larger credit packages to receive volume discounts. Custom enterprise
                      pricing is available for high-volume users.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-1">Billing</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      Credits never expire and are only consumed when you make API calls. You can
                      purchase additional credits at any time.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div>
              {/* API Credentials */}
              {!hasCredentials() ? (
                <ApiKeyForm className="mb-8" />
              ) : (
                <Card title="Account Information" className="mb-8">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Bot ID</h4>
                      <p className="font-mono">{getBotId()}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        API Key
                      </h4>
                      <p className="font-mono">••••••••••••••••</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Credits Remaining
                      </h4>
                      {remainingCredits !== null ? (
                        <p className="text-2xl font-bold text-primary-950 dark:text-primary-400">
                          {remainingCredits.toLocaleString()}
                        </p>
                      ) : (
                        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* FAQ */}
              <Card title="Frequently Asked Questions">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-1">How do I use my credits?</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Credits are automatically deducted from your account when you make API calls.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Do credits expire?</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      No, credits never expire and are only consumed when you make API calls.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Can I get a refund?</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Refunds are available within 30 days of purchase if credits have not been used.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">How do I check my usage?</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Visit the Usage Dashboard to view your API usage and credit balance.
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

export default Purchase;
