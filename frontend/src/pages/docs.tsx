import React from 'react';
import { NextPage } from 'next';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import Card from '../components/Card';

const Docs: NextPage = () => {
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
                  Explore the complete API reference documentation using our interactive Swagger UI.
                </p>
              </div>
            </div>
          </Card>
          
          {/* Swagger UI iframe */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white">
            <iframe 
              src={process.env.NEXT_PUBLIC_API_BASE_URL ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace('/v1', '')}/docs` : 'http://localhost:3001/docs'}
              className="w-full h-[800px]"
              title="Agentive API Documentation"
            />
          </div>
          
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
            
            <Card title="API Versioning">
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  The Agentive API uses versioning to ensure backward compatibility as we add new features and improvements.
                </p>
                
                <div>
                  <h4 className="font-medium mb-1">Current Version: v1</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    All API endpoints are prefixed with <code>/v1/</code> to indicate the version.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Version Lifecycle</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    When we release a new version, we'll continue to support previous versions for at least 12 months, giving you time to migrate.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Breaking Changes</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    We'll never make breaking changes to an existing API version. Any breaking changes will be introduced in a new version.
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
