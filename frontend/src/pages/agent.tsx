import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FiArrowLeft, FiInfo, FiAlertTriangle, FiLock } from 'react-icons/fi';
import AgentChat from '../components/AgentChat';
import { useApiKey } from '../utils/api';

const Agent: NextPage = () => {
  const router = useRouter();
  const { hasCredentials, setBotId, setApiKey } = useApiKey();
  const [isClient, setIsClient] = useState(false);
  const [showApiWarning, setShowApiWarning] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [botId, setBotIdInput] = useState('');
  const [apiKey, setApiKeyInput] = useState('');

  // This effect ensures we only render the component on the client side
  // to avoid localStorage errors during server-side rendering
  useEffect(() => {
    setIsClient(true);
    
    // Check if we're in development mode without backend
    const checkBackendAvailability = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/v1'}/agent/models`, {
          method: 'HEAD',
          headers: {
            'x-api-key': 'test',
            'x-bot-id': 'test',
            'x-sandbox-mode': 'true'
          }
        });
        setShowApiWarning(!response.ok);
      } catch (error) {
        setShowApiWarning(true);
      }
    };
    
    checkBackendAvailability();
  }, []);

  // Check if credentials are available
  useEffect(() => {
    if (isClient) {
      setNeedsAuth(!hasCredentials());
    }
  }, [isClient, hasCredentials]);

  // Handle login form submission
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (botId && apiKey) {
      setBotId(botId);
      setApiKey(apiKey);
      setNeedsAuth(false);
    }
  };

  // Enable sandbox mode
  const enableSandbox = () => {
    // Use sandbox credentials
    const sandboxBotId = 'sandbox-bot-' + Math.random().toString(36).substring(2, 8);
    const sandboxApiKey = 'sk-sandbox-' + Math.random().toString(36).substring(2, 15);
    
    setBotId(sandboxBotId);
    setApiKey(sandboxApiKey);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('agentive_sandbox_mode', 'true');
    }
    
    setNeedsAuth(false);
  };

  if (!isClient) {
    return null; // Don't render anything during SSR
  }

  // Show login form if credentials are needed
  if (needsAuth) {
    return (
      <>
        <Head>
          <title>AI Agent | Agentive</title>
          <meta name="description" content="Interact with Agentive's AI assistant" />
        </Head>

        <div className="container px-4 py-8 mx-auto">
          <div className="mb-6">
            <button
              onClick={() => router.push('/')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <FiArrowLeft className="mr-2" /> Back to Home
            </button>
          </div>

          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold">AI Agent</h1>
              <p className="mt-2 text-gray-600">
                Please provide your credentials to access the AI agent
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-center mb-6">
                <div className="p-3 rounded-full bg-blue-100 text-blue-500">
                  <FiLock size={24} />
                </div>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="botId" className="block text-sm font-medium text-gray-700 mb-1">
                    Bot ID
                  </label>
                  <input
                    type="text"
                    id="botId"
                    value={botId}
                    onChange={(e) => setBotIdInput(e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Enter your Bot ID"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    type="password"
                    id="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Enter your API Key"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Login
                </button>
              </form>
              
              <div className="mt-6 pt-6 border-t text-center">
                <p className="text-sm text-gray-600 mb-2">Don't have credentials?</p>
                <button
                  onClick={enableSandbox}
                  className="text-blue-500 hover:text-blue-700 font-medium"
                >
                  Use Sandbox Mode
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>AI Agent | Agentive</title>
        <meta name="description" content="Interact with Agentive's AI assistant" />
      </Head>

      <div className="container px-4 py-8 mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft className="mr-2" /> Back
          </button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">AI Agent</h1>
          <p className="mt-2 text-gray-600">
            Interact with your AI agent to perform tasks and answer questions.
          </p>
          
          {showApiWarning && (
            <div className="p-4 mt-4 text-amber-800 bg-amber-100 border border-amber-200 rounded-lg">
              <div className="flex items-center mb-2">
                <FiAlertTriangle className="mr-2" />
                <span className="font-medium">Backend API Not Available</span>
              </div>
              <p className="text-sm">
                The backend API is not currently available. The chat interface will display mock responses.
                To enable full functionality, deploy the Supabase Edge Functions and set up the required API keys.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main chat interface */}
          <div className="lg:col-span-2">
            <AgentChat 
              systemPrompt="You are a helpful AI assistant for Agentive, a platform that enables users to delegate web browsing and desktop automation tasks to AI agents. You can answer questions about Agentive's features, capabilities, and how to use the platform effectively."
              className="h-[600px]"
            />
          </div>

          {/* Sidebar with information */}
          <div className="lg:col-span-1">
            <div className="p-6 bg-white rounded-lg shadow-lg">
              <h2 className="flex items-center mb-4 text-xl font-semibold">
                <FiInfo className="mr-2 text-blue-500" /> About AI Agents
              </h2>
              
              <div className="mb-6">
                <h3 className="mb-2 text-lg font-medium">What can agents do?</h3>
                <ul className="pl-5 space-y-2 list-disc">
                  <li>Answer questions and provide information</li>
                  <li>Automate web browsing tasks</li>
                  <li>Extract and process data from websites</li>
                  <li>Fill out forms and navigate web interfaces</li>
                  <li>Perform desktop automation tasks</li>
                  <li>Interact with files and applications</li>
                </ul>
              </div>
              
              <div className="mb-6">
                <h3 className="mb-2 text-lg font-medium">Tips for effective prompts</h3>
                <ul className="pl-5 space-y-2 list-disc">
                  <li>Be specific about what you want the agent to do</li>
                  <li>Provide context and necessary information</li>
                  <li>Break complex tasks into smaller steps</li>
                  <li>Specify the format you want for the output</li>
                </ul>
              </div>
              
              <div>
                <h3 className="mb-2 text-lg font-medium">Available models</h3>
                <p className="mb-2 text-sm text-gray-600">
                  Different models have different capabilities and pricing. Advanced models like GPT-4o and Claude 3.5 provide better reasoning and understanding but use more credits.
                </p>
                <div className="p-3 text-sm bg-gray-100 rounded">
                  <div className="flex justify-between mb-1">
                    <span>Model</span>
                    <span>Best for</span>
                  </div>
                  <div className="flex justify-between py-1 border-t">
                    <span>GPT-4o</span>
                    <span>Complex reasoning</span>
                  </div>
                  <div className="flex justify-between py-1 border-t">
                    <span>Claude 3.5</span>
                    <span>Detailed analysis</span>
                  </div>
                  <div className="flex justify-between py-1 border-t">
                    <span>GPT-3.5</span>
                    <span>Simple tasks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Agent;
