import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useApiAvailability } from '../utils/api';

const GraphQLPlayground = () => {
  const router = useRouter();
  const { apiAvailable } = useApiAvailability();
  const [isClient, setIsClient] = useState(false);
  const [sandboxMode, setSandboxMode] = useState(true);
  const [botId, setBotId] = useState('sandbox-bot-demo');
  const [apiKey, setApiKey] = useState('');

  // Set isClient to true when component mounts
  useEffect(() => {
    setIsClient(true);
    
    // Check for sandbox mode in localStorage
    const storedSandboxMode = localStorage.getItem('sandboxMode');
    if (storedSandboxMode !== null) {
      setSandboxMode(storedSandboxMode === 'true');
    }
    
    // Check for botId in localStorage
    const storedBotId = localStorage.getItem('botId');
    if (storedBotId) {
      setBotId(storedBotId);
    }
    
    // Check for apiKey in localStorage
    const storedApiKey = localStorage.getItem('apiKey');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  // Save sandbox mode to localStorage when it changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('sandboxMode', sandboxMode.toString());
    }
  }, [sandboxMode, isClient]);

  // Save botId to localStorage when it changes
  useEffect(() => {
    if (isClient && botId) {
      localStorage.setItem('botId', botId);
    }
  }, [botId, isClient]);

  // Save apiKey to localStorage when it changes
  useEffect(() => {
    if (isClient && apiKey) {
      localStorage.setItem('apiKey', apiKey);
    }
  }, [apiKey, isClient]);

  // Generate the GraphQL Playground HTML
  const generatePlaygroundHtml = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>GraphQL Playground</title>
          <meta name="viewport" content="user-scalable=no, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, minimal-ui" />
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/graphql-playground-react/build/static/css/index.css" />
          <link rel="shortcut icon" href="https://cdn.jsdelivr.net/npm/graphql-playground-react/build/favicon.png" />
          <script src="https://cdn.jsdelivr.net/npm/graphql-playground-react/build/static/js/middleware.js"></script>
        </head>
        <body>
          <div id="root">
            <style>
              body {
                background-color: rgb(23, 42, 58);
                font-family: Open Sans, sans-serif;
                height: 90vh;
              }
              #root {
                height: 100%;
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .loading {
                font-size: 32px;
                font-weight: 200;
                color: rgba(255, 255, 255, .6);
                margin-left: 20px;
              }
              img {
                width: 78px;
                height: 78px;
              }
              .title {
                font-weight: 400;
              }
            </style>
            <img src='https://cdn.jsdelivr.net/npm/graphql-playground-react/build/logo.png' alt=''>
            <div class="loading">
              Loading <span class="title">GraphQL Playground</span>
            </div>
          </div>
          <script>
            const apiUrl = '${process.env.NEXT_PUBLIC_API_BASE_URL}/graphql';
            const botId = '${botId}';
            const apiKey = '${apiKey}';
            const sandboxMode = ${sandboxMode};
            
            window.addEventListener('load', function(event) {
              const headers = {
                'x-bot-id': botId,
              };
              
              if (sandboxMode) {
                headers['x-sandbox-mode'] = 'true';
              } else if (apiKey) {
                headers['x-api-key'] = apiKey;
              }
              
              GraphQLPlayground.init(document.getElementById('root'), {
                endpoint: apiUrl,
                settings: {
                  'request.credentials': 'include',
                  'editor.theme': 'dark',
                  'editor.cursorShape': 'line',
                  'editor.reuseHeaders': true,
                  'tracing.hideTracingResponse': true,
                  'editor.fontSize': 14,
                  'editor.fontFamily': "'Source Code Pro', 'Consolas', 'Inconsolata', 'Droid Sans Mono', 'Monaco', monospace",
                },
                headers: headers
              });
            });
          </script>
        </body>
      </html>
    `;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>GraphQL Playground | Agentive</title>
        <meta name="description" content="Test your GraphQL queries with Agentive's GraphQL Playground" />
      </Head>

      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">GraphQL Playground</h1>
          
          {!apiAvailable && (
            <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100 rounded-lg">
              <p className="font-medium">⚠️ API Not Available</p>
              <p className="text-sm">The backend API is currently unavailable. The playground will use mock data in sandbox mode.</p>
            </div>
          )}
          
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="botId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bot ID
              </label>
              <input
                type="text"
                id="botId"
                value={botId}
                onChange={(e) => setBotId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your Bot ID"
              />
            </div>
            
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Key {sandboxMode && <span className="text-gray-500">(Not required in sandbox mode)</span>}
              </label>
              <input
                type="password"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={sandboxMode}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-800 disabled:cursor-not-allowed"
                placeholder="Enter your API Key"
              />
            </div>
          </div>
          
          <div className="mb-6 flex items-center">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={sandboxMode}
                onChange={(e) => setSandboxMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Sandbox Mode</span>
            </label>
          </div>
          
          <button
            onClick={() => router.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Apply Changes
          </button>
        </div>
        
        {isClient && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden" style={{ height: '70vh' }}>
            <iframe
              srcDoc={generatePlaygroundHtml()}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="GraphQL Playground"
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default GraphQLPlayground;
