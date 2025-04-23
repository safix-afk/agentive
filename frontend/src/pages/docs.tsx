import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import Card from '../components/Card';
import { Tab } from '@headlessui/react';
import { useApiKey } from '../utils/api';

const Docs: NextPage = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const { hasCredentials, getBotId, getApiKey } = useApiKey();
  const [sandboxMode, setSandboxMode] = useState(false);

  // Set isClient to true when component mounts
  useEffect(() => {
    setIsClient(true);
    
    // Check for sandbox mode in localStorage
    const storedSandboxMode = localStorage.getItem('sandboxMode');
    if (storedSandboxMode !== null) {
      setSandboxMode(storedSandboxMode === 'true');
    }
    
    // Listen for sandbox mode changes
    const handleSandboxModeChange = (event: CustomEvent) => {
      setSandboxMode(event.detail.sandboxMode);
    };
    
    window.addEventListener('sandboxModeChanged', handleSandboxModeChange as EventListener);
    
    return () => {
      window.removeEventListener('sandboxModeChanged', handleSandboxModeChange as EventListener);
    };
  }, []);

  // Generate Swagger UI URL
  const getSwaggerUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL 
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace('/v1', '')}/docs` 
      : 'http://localhost:3001/docs';
    
    // Add sandbox mode and credentials if available
    const params = new URLSearchParams();
    
    if (sandboxMode) {
      params.append('sandbox', 'true');
    }
    
    if (hasCredentials()) {
      params.append('botId', getBotId());
      params.append('apiKey', getApiKey());
    }
    
    return `${baseUrl}${params.toString() ? '?' + params.toString() : ''}`;
  };

  // Generate GraphQL Playground HTML
  const generatePlaygroundHtml = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL 
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace('/v1', '')}/graphql` 
      : 'http://localhost:3001/graphql';
    
    const botId = hasCredentials() ? getBotId() : 'sandbox-bot-demo';
    const apiKey = hasCredentials() ? getApiKey() : '';
    
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
                height: 100vh;
                margin: 0;
                overflow: hidden;
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
            const apiUrl = '${apiUrl}';
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
    <Layout
      title="API Documentation - Agentive"
      description="Comprehensive API documentation for the Agentive platform"
    >
      <div className="container-custom py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-8">API Documentation</h1>
          
          <Card className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Agentive API Reference</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Explore our API using REST or GraphQL interfaces with interactive documentation.
                </p>
              </div>
              
              {sandboxMode && (
                <div className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 rounded-full text-sm">
                  Sandbox Mode Active
                </div>
              )}
            </div>
          </Card>
          
          {/* API Documentation Tabs */}
          <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
            <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1 mb-4">
              <Tab
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200
                  ${
                    selected
                      ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/[0.12] hover:text-blue-600 dark:hover:text-blue-400'
                  }`
                }
              >
                REST API
              </Tab>
              <Tab
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200
                  ${
                    selected
                      ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/[0.12] hover:text-blue-600 dark:hover:text-blue-400'
                  }`
                }
              >
                GraphQL API
              </Tab>
              <Tab
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200
                  ${
                    selected
                      ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/[0.12] hover:text-blue-600 dark:hover:text-blue-400'
                  }`
                }
              >
                API Schema (SDL)
              </Tab>
            </Tab.List>
            <Tab.Panels className="mt-2">
              <Tab.Panel className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
                {isClient && (
                  <iframe 
                    src={getSwaggerUrl()}
                    className="w-full h-[800px]"
                    title="Agentive REST API Documentation"
                  />
                )}
              </Tab.Panel>
              <Tab.Panel className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
                {isClient && (
                  <iframe 
                    srcDoc={generatePlaygroundHtml()}
                    className="w-full h-[800px]"
                    title="Agentive GraphQL API Documentation"
                  />
                )}
              </Tab.Panel>
              <Tab.Panel className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden p-8">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
                  {isClient && (
                    <>
                      {fetch('/src/pages/docs/api-sdl.graphql')
                        .then(res => res.text())
                        .then(text => text)
                        .catch(() => 'Failed to load GraphQL SDL.')}
                    </>
                  )}
                </pre>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <Card title="Getting Started">
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  To get started with the Agentive API, you'll need to:
                </p>
                
                <ol className="list-decimal list-inside text-gray-600 dark:text-gray-300 space-y-2">
                  <li>Register for an account to receive your Bot ID and API Key</li>
                  <li>Purchase credits to use for API calls</li>
                  <li>Integrate the API into your application using our examples</li>
                  <li>Monitor your usage in the dashboard</li>
                </ol>
                
                <p className="text-gray-600 dark:text-gray-300">
                  Refer to the API documentation for detailed information on endpoints, request parameters, and response formats.
                </p>
              </div>
            </Card>
            
            <Card title="API Interfaces">
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  The Agentive platform offers two API interfaces to suit your development preferences:
                </p>
                
                <div>
                  <h4 className="font-medium mb-1">REST API</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Our traditional REST API provides predictable resource-oriented URLs and standard HTTP methods.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">GraphQL API</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Our GraphQL API allows you to request exactly the data you need in a single request, reducing over-fetching.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Sandbox Mode</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Use sandbox mode to test your integration without consuming credits or affecting production data.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Docs;
