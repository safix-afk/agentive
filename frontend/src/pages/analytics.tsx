import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import Card from '../components/Card';
import ApiKeyForm from '../components/ApiKeyForm';
import { endpoints, useApiKey, useApiAvailability } from '../utils/api';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsData {
  hourlyApiCalls: {
    labels: string[];
    data: number[];
  };
  errorsByEndpoint: {
    labels: string[];
    data: number[];
  };
  summary: {
    totalCalls: number;
    totalErrors: number;
    averageLatency: number;
  };
}

const Analytics: NextPage = () => {
  const { hasCredentials, getBotId } = useApiKey();
  const { apiAvailable } = useApiAvailability();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(60); // in seconds
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Chart theme colors
  const isDarkMode = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
  const chartColors = {
    primary: isDarkMode ? 'rgba(59, 130, 246, 0.8)' : 'rgba(37, 99, 235, 0.8)',
    secondary: isDarkMode ? 'rgba(239, 68, 68, 0.8)' : 'rgba(220, 38, 38, 0.8)',
    grid: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    text: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
  };

  // Chart options
  const lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        grid: {
          color: chartColors.grid
        },
        ticks: {
          color: chartColors.text
        }
      },
      y: {
        grid: {
          color: chartColors.grid
        },
        ticks: {
          color: chartColors.text
        },
        beginAtZero: true
      }
    }
  };

  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        grid: {
          color: chartColors.grid
        },
        ticks: {
          color: chartColors.text
        }
      },
      y: {
        grid: {
          color: chartColors.grid
        },
        ticks: {
          color: chartColors.text
        },
        beginAtZero: true
      }
    }
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    if (!hasCredentials()) return;

    setIsLoading(true);
    setError(null);

    try {
      const botId = getBotId();
      const response = await endpoints.getAnalytics(botId);
      setAnalyticsData(response.data);
      setLastRefreshed(new Date());
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Failed to fetch analytics data. Please try again.'
      );
      console.error('Analytics fetch error:', err);
      
      // Generate mock data if API is not available
      if (!apiAvailable) {
        generateMockAnalyticsData();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mock analytics data for demonstration
  const generateMockAnalyticsData = () => {
    // Generate random data for hourly API calls (last 24 hours)
    const hours = Array.from({ length: 24 }, (_, i) => {
      const date = new Date();
      date.setHours(date.getHours() - 23 + i);
      return date.getHours() + ':00';
    });
    
    const hourlyData = Array.from({ length: 24 }, () => 
      Math.floor(Math.random() * 100) + 10
    );
    
    // Generate random data for errors by endpoint (last 7 days)
    const endpoints = [
      'agent', 'bot', 'purchase', 'usage', 'webhooks', 'graphql'
    ];
    
    const errorData = endpoints.map(() => 
      Math.floor(Math.random() * 20)
    );
    
    // Calculate summary statistics
    const totalCalls = hourlyData.reduce((sum, val) => sum + val, 0);
    const totalErrors = errorData.reduce((sum, val) => sum + val, 0);
    const averageLatency = Math.floor(Math.random() * 300) + 50; // 50-350ms
    
    setAnalyticsData({
      hourlyApiCalls: {
        labels: hours,
        data: hourlyData
      },
      errorsByEndpoint: {
        labels: endpoints,
        data: errorData
      },
      summary: {
        totalCalls,
        totalErrors,
        averageLatency
      }
    });
    
    setLastRefreshed(new Date());
  };

  // Set up auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const intervalId = setInterval(() => {
      fetchAnalytics();
    }, refreshInterval * 1000);
    
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval]);

  // Initial data fetch
  useEffect(() => {
    if (hasCredentials()) {
      fetchAnalytics();
    } else if (!apiAvailable) {
      // Generate mock data for demonstration
      generateMockAnalyticsData();
    }
  }, []);

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Layout
      title="Analytics - Agentive"
      description="Real-time analytics for your Agentive account"
    >
      <div className="container-custom py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-wrap items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <div className="flex items-center">
                <label htmlFor="auto-refresh" className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Auto-refresh:
                </label>
                <select
                  id="auto-refresh"
                  value={autoRefresh ? refreshInterval.toString() : "0"}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setAutoRefresh(value > 0);
                    if (value > 0) setRefreshInterval(value);
                  }}
                  className="text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  aria-label="Auto-refresh interval"
                >
                  <option value="0">Off</option>
                  <option value="30">30s</option>
                  <option value="60">1m</option>
                  <option value="300">5m</option>
                </select>
              </div>
              
              <button
                onClick={fetchAnalytics}
                disabled={isLoading}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Refresh analytics data"
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {!hasCredentials() && apiAvailable && (
            <div className="mb-8">
              <ApiKeyForm />
            </div>
          )}

          {error && (
            <div className="mb-8 p-4 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}

          {lastRefreshed && (
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Last updated: {formatTime(lastRefreshed)}
              {!apiAvailable && (
                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 rounded text-xs">
                  Demo Data
                </span>
              )}
            </div>
          )}

          {analyticsData && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Total API Calls</h3>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {analyticsData.summary.totalCalls.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Last 24 hours
                  </p>
                </Card>
                
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Total Errors</h3>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {analyticsData.summary.totalErrors.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Last 7 days
                  </p>
                </Card>
                
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Average Latency</h3>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {analyticsData.summary.averageLatency.toLocaleString()} ms
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Last 24 hours
                  </p>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card title="API Calls per Hour" className="p-6">
                  <div className="h-80">
                    <Line
                      data={{
                        labels: analyticsData.hourlyApiCalls.labels,
                        datasets: [
                          {
                            label: 'API Calls',
                            data: analyticsData.hourlyApiCalls.data,
                            borderColor: chartColors.primary,
                            backgroundColor: chartColors.primary + '40',
                            fill: true,
                            tension: 0.4
                          }
                        ]
                      }}
                      options={lineChartOptions}
                    />
                  </div>
                </Card>
                
                <Card title="Errors by Endpoint" className="p-6">
                  <div className="h-80">
                    <Bar
                      data={{
                        labels: analyticsData.errorsByEndpoint.labels,
                        datasets: [
                          {
                            label: 'Errors',
                            data: analyticsData.errorsByEndpoint.data,
                            backgroundColor: chartColors.secondary
                          }
                        ]
                      }}
                      options={barChartOptions}
                    />
                  </div>
                </Card>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default Analytics;
