import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Button from './Button';

interface ApiKeyFormProps {
  onSubmit?: (botId: string, apiKey: string, authType: string, clientId?: string, clientSecret?: string) => void;
  className?: string;
  id?: string;
}

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ 
  onSubmit, 
  className = '',
  id
}) => {
  const [botId, setBotId] = useState('');
  const [authType, setAuthType] = useState('apiKey'); // 'apiKey' or 'oauth2'
  const [apiKey, setApiKey] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenExpiry, setTokenExpiry] = useState<number | null>(null);
  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load saved credentials from localStorage
    const savedBotId = localStorage.getItem('agentive_bot_id');
    const savedAuthType = localStorage.getItem('agentive_auth_type') || 'apiKey';
    const savedApiKey = localStorage.getItem('agentive_api_key');
    const savedClientId = localStorage.getItem('agentive_client_id');
    const savedClientSecret = localStorage.getItem('agentive_client_secret');
    const savedTokenExpiry = localStorage.getItem('agentive_token_expiry');
    
    if (savedBotId) setBotId(savedBotId);
    if (savedAuthType) setAuthType(savedAuthType);
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedClientId) setClientId(savedClientId);
    if (savedClientSecret) setClientSecret(savedClientSecret);
    if (savedTokenExpiry) setTokenExpiry(parseInt(savedTokenExpiry));
    
    // Set up token refresh if using OAuth2
    if (savedAuthType === 'oauth2' && savedClientId && savedClientSecret && savedTokenExpiry) {
      setupTokenRefresh(parseInt(savedTokenExpiry));
    }
    
    return () => {
      // Clean up timer on unmount
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
    };
  }, []);

  // Setup token refresh timer
  const setupTokenRefresh = (expiryTimestamp: number) => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
    
    const now = Date.now();
    const timeUntilExpiry = expiryTimestamp - now;
    
    // Refresh 5 minutes before expiry
    const refreshTime = Math.max(0, timeUntilExpiry - (5 * 60 * 1000));
    
    if (refreshTime > 0) {
      const timer = setTimeout(() => {
        refreshOAuthToken();
      }, refreshTime);
      
      setRefreshTimer(timer);
    } else {
      // Token already expired or about to expire, refresh now
      refreshOAuthToken();
    }
  };

  // Refresh OAuth token
  const refreshOAuthToken = async () => {
    if (authType !== 'oauth2' || !clientId || !clientSecret) {
      return;
    }
    
    try {
      // Mock OAuth token refresh for now
      // In a real implementation, this would call your OAuth token endpoint
      console.log('Refreshing OAuth token...');
      
      // Simulate token response
      const expiresIn = 3600; // 1 hour in seconds
      const newToken = `oauth2_${Math.random().toString(36).substring(2, 15)}`;
      const expiryTime = Date.now() + (expiresIn * 1000);
      
      // Save new token
      localStorage.setItem('agentive_api_key', newToken);
      localStorage.setItem('agentive_token_expiry', expiryTime.toString());
      
      setApiKey(newToken);
      setTokenExpiry(expiryTime);
      
      // Setup next refresh
      setupTokenRefresh(expiryTime);
      
      console.log('OAuth token refreshed successfully');
    } catch (err) {
      console.error('Failed to refresh OAuth token:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    if (!botId.trim()) {
      setError('Bot ID is required');
      return;
    }
    
    if (authType === 'apiKey' && !apiKey.trim()) {
      setError('API Key is required');
      return;
    }
    
    if (authType === 'oauth2') {
      if (!clientId.trim()) {
        setError('Client ID is required');
        return;
      }
      
      if (!clientSecret.trim()) {
        setError('Client Secret is required');
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      // Save to localStorage
      localStorage.setItem('agentive_bot_id', botId);
      localStorage.setItem('agentive_auth_type', authType);
      
      if (authType === 'apiKey') {
        localStorage.setItem('agentive_api_key', apiKey);
        localStorage.removeItem('agentive_client_id');
        localStorage.removeItem('agentive_client_secret');
        localStorage.removeItem('agentive_token_expiry');
        
        // Clear any existing refresh timer
        if (refreshTimer) {
          clearTimeout(refreshTimer);
          setRefreshTimer(null);
        }
      } else if (authType === 'oauth2') {
        localStorage.setItem('agentive_client_id', clientId);
        localStorage.setItem('agentive_client_secret', clientSecret);
        
        // Get OAuth token
        // In a real implementation, this would call your OAuth token endpoint
        const expiresIn = 3600; // 1 hour in seconds
        const token = `oauth2_${Math.random().toString(36).substring(2, 15)}`;
        const expiryTime = Date.now() + (expiresIn * 1000);
        
        localStorage.setItem('agentive_api_key', token);
        localStorage.setItem('agentive_token_expiry', expiryTime.toString());
        
        setApiKey(token);
        setTokenExpiry(expiryTime);
        
        // Setup token refresh
        setupTokenRefresh(expiryTime);
      }
      
      // Call onSubmit if provided
      if (onSubmit) {
        await onSubmit(botId, apiKey, authType, clientId, clientSecret);
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save credentials');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCredentials = () => {
    localStorage.removeItem('agentive_bot_id');
    localStorage.removeItem('agentive_auth_type');
    localStorage.removeItem('agentive_api_key');
    localStorage.removeItem('agentive_client_id');
    localStorage.removeItem('agentive_client_secret');
    localStorage.removeItem('agentive_token_expiry');
    
    setBotId('');
    setAuthType('apiKey');
    setApiKey('');
    setClientId('');
    setClientSecret('');
    setTokenExpiry(null);
    setSuccess(false);
    
    // Clear any existing refresh timer
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      setRefreshTimer(null);
    }
  };

  return (
    <motion.div 
      id={id}
      className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="text-lg font-semibold mb-4">API Credentials</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="botId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Bot ID
          </label>
          <input
            id="botId"
            type="text"
            value={botId}
            onChange={(e) => setBotId(e.target.value)}
            className="input"
            placeholder="Enter your Bot ID"
            aria-label="Bot ID"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="authType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Authentication Type
          </label>
          <div className="relative">
            <select
              id="authType"
              value={authType}
              onChange={(e) => setAuthType(e.target.value)}
              className="input appearance-none pr-8"
              aria-label="Authentication Type"
            >
              <option value="apiKey">API Key</option>
              <option value="oauth2">OAuth2</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>
        
        {authType === 'apiKey' ? (
          <div className="mb-4">
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="input"
              placeholder="Enter your API Key"
              aria-label="API Key"
            />
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Client ID
              </label>
              <input
                id="clientId"
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="input"
                placeholder="Enter your OAuth2 Client ID"
                aria-label="Client ID"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="clientSecret" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Client Secret
              </label>
              <input
                id="clientSecret"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className="input"
                placeholder="Enter your OAuth2 Client Secret"
                aria-label="Client Secret"
              />
            </div>
            
            {tokenExpiry && (
              <div className="mb-4 p-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded text-sm">
                Token expires: {new Date(tokenExpiry).toLocaleString()}
                <div className="text-xs mt-1">
                  (Will auto-refresh 5 minutes before expiry)
                </div>
              </div>
            )}
          </>
        )}
        
        {error && (
          <motion.div 
            className="mb-4 p-2 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {error}
          </motion.div>
        )}
        
        {success && (
          <motion.div 
            className="mb-4 p-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            Credentials saved successfully!
          </motion.div>
        )}
        
        <div className="flex space-x-2">
          <Button 
            type="submit" 
            variant="primary" 
            isLoading={isLoading}
            fullWidth
          >
            Save Credentials
          </Button>
          
          {(botId || apiKey || clientId || clientSecret) && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={clearCredentials}
            >
              Clear
            </Button>
          )}
        </div>
      </form>
    </motion.div>
  );
};

export default ApiKeyForm;
