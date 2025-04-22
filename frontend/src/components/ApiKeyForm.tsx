import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Button from './Button';

interface ApiKeyFormProps {
  onSubmit?: (botId: string, apiKey: string) => void;
  className?: string;
  id?: string;
}

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ 
  onSubmit, 
  className = '',
  id
}) => {
  const [botId, setBotId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Load saved credentials from localStorage
    const savedBotId = localStorage.getItem('agentive_bot_id');
    const savedApiKey = localStorage.getItem('agentive_api_key');
    
    if (savedBotId) setBotId(savedBotId);
    if (savedApiKey) setApiKey(savedApiKey);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    if (!botId.trim()) {
      setError('Bot ID is required');
      return;
    }
    
    if (!apiKey.trim()) {
      setError('API Key is required');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Save to localStorage
      localStorage.setItem('agentive_bot_id', botId);
      localStorage.setItem('agentive_api_key', apiKey);
      
      // Call onSubmit if provided
      if (onSubmit) {
        await onSubmit(botId, apiKey);
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
    localStorage.removeItem('agentive_api_key');
    setBotId('');
    setApiKey('');
    setSuccess(false);
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
          />
        </div>
        
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
          />
        </div>
        
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
          
          {(botId || apiKey) && (
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
