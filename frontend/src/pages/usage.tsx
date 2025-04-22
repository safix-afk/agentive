import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { motion } from 'framer-motion';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import ApiKeyForm from '../components/ApiKeyForm';
import { endpoints, useApiKey } from '../utils/api';

interface UsageData {
  botId: string;
  creditBalance: {
    creditsRemaining: number;
    dailyLimit: number;
    resetDate: string;
  };
  usageStats: {
    totalRequests: number;
    successCount: number;
    errorCount: number;
    creditsUsed: number;
  };
  dailyUsage: {
    date: string;
    requestCount: number;
    creditsUsed: number;
  }[];
  endpointBreakdown: Record<string, number>;
  errorBreakdown: Record<string, number>;
}

const Usage: NextPage = () => {
  const { hasCredentials, getBotId } = useApiKey();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>('7d');

  useEffect(() => {
    fetchUsageData();
  }, [period]);

  const fetchUsageData = async () => {
    if (!hasCredentials()) return;

    setIsLoading(true);
    setError(null);

    try {
      const botId = getBotId();
      const response = await endpoints.getUsage(botId, period);
      setUsageData(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Failed to fetch usage data. Please try again.'
      );
      console.error('Usage data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchUsageData();
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Get daily usage data for charts
  const getDailyUsageData = () => {
    if (!usageData || !usageData.dailyUsage) return [];
    return usageData.dailyUsage.map(day => day.requestCount);
  };

  const getDailyCreditsData = () => {
    if (!usageData || !usageData.dailyUsage) return [];
    return usageData.dailyUsage.map(day => day.creditsUsed);
  };

  // Loading skeleton for cards
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse"></div>
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  );

  return (
    <Layout
      title="Usage Dashboard - Agentive"
      description="Monitor your API usage, credit balance, and request history"
    >
      <div className="container-custom py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <h1 className="text-3xl font-bold mb-4 md:mb-0">Usage Dashboard</h1>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant={period === '7d' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handlePeriodChange('7d')}
              >
                7 Days
              </Button>
              <Button
                variant={period === '30d' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handlePeriodChange('30d')}
              >
                30 Days
              </Button>
              <Button
                variant={period === '90d' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handlePeriodChange('90d')}
              >
                90 Days
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRefresh}
                isLoading={isLoading}
              >
                Refresh
              </Button>
            </div>
          </div>

          {!hasCredentials() ? (
            <div className="mb-8">
              <ApiKeyForm />
            </div>
          ) : error ? (
            <div className="mb-8 p-4 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
              {error}
            </div>
          ) : isLoading && !usageData ? (
            <LoadingSkeleton />
          ) : usageData ? (
            <div id="usage-dashboard">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Credits Remaining
                  </h3>
                  <p className="text-3xl font-bold text-primary-950 dark:text-primary-400">
                    {usageData.creditBalance.creditsRemaining.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Daily Limit: {usageData.creditBalance.dailyLimit.toLocaleString()}
                  </p>
                </Card>

                <Card>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Total Requests
                  </h3>
                  <p className="text-3xl font-bold">
                    {usageData.usageStats.totalRequests.toLocaleString()}
                  </p>
                  <div className="mt-2">
                    <Sparklines data={getDailyUsageData()} height={30} margin={5}>
                      <SparklinesLine color="#4F46E5" />
                      <SparklinesSpots />
                    </Sparklines>
                  </div>
                </Card>

                <Card>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Success Rate
                  </h3>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {usageData.usageStats.totalRequests
                      ? Math.round(
                          (usageData.usageStats.successCount / usageData.usageStats.totalRequests) * 100
                        )
                      : 0}
                    %
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {usageData.usageStats.successCount.toLocaleString()} successful requests
                  </p>
                </Card>

                <Card>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Credits Used
                  </h3>
                  <p className="text-3xl font-bold">
                    {usageData.usageStats.creditsUsed.toLocaleString()}
                  </p>
                  <div className="mt-2">
                    <Sparklines data={getDailyCreditsData()} height={30} margin={5}>
                      <SparklinesLine color="#22D3EE" />
                      <SparklinesSpots />
                    </Sparklines>
                  </div>
                </Card>
              </div>

              {/* Daily Usage Chart */}
              <Card title="Daily Usage" className="mb-8">
                <div className="h-64">
                  {usageData.dailyUsage && usageData.dailyUsage.length > 0 ? (
                    <div className="relative h-full">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Requests</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Credits</span>
                      </div>
                      
                      <div className="flex h-full items-end">
                        {usageData.dailyUsage.map((day, index) => (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div className="w-full px-1">
                              <div 
                                className="usage-bar"
                                style={{ 
                                  '--bar-height': `${Math.max(
                                    (day.requestCount / Math.max(...getDailyUsageData())) * 100,
                                    5
                                  )}%` 
                                } as React.CSSProperties}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              {formatDate(day.date)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500 dark:text-gray-400">No usage data available</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Endpoint and Error Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <Card title="Endpoint Breakdown">
                  {Object.keys(usageData.endpointBreakdown).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(usageData.endpointBreakdown)
                        .sort(([, a], [, b]) => b - a)
                        .map(([endpoint, count]) => (
                          <div key={endpoint}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{endpoint}</span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {count.toLocaleString()} requests
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="usage-progress-bar"
                                style={{
                                  '--bar-width': `${
                                    (count / usageData.usageStats.totalRequests) * 100
                                  }%`
                                } as React.CSSProperties}
                              ></div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No endpoint data available</p>
                  )}
                </Card>

                <Card title="Error Breakdown">
                  {Object.keys(usageData.errorBreakdown).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(usageData.errorBreakdown)
                        .sort(([, a], [, b]) => b - a)
                        .map(([errorType, count]) => (
                          <div key={errorType}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{errorType}</span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {count.toLocaleString()} errors
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="error-progress-bar"
                                style={{
                                  '--bar-width': `${
                                    (count / usageData.usageStats.errorCount) * 100
                                  }%`
                                } as React.CSSProperties}
                              ></div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No errors recorded</p>
                  )}
                </Card>
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </Layout>
  );
};

export default Usage;
