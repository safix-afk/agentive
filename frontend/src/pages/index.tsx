import React, { useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import Layout from '../components/Layout';
import Button from '../components/Button';
import ApiKeyForm from '../components/ApiKeyForm';
import Card from '../components/Card';
import demoTour from '../tours/demoTour';

const Home: NextPage = () => {
  const [runTour, setRunTour] = useState(false);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRunTour(false);
    }
  };

  const startTour = () => {
    setRunTour(true);
  };

  return (
    <Layout
      title="Agentive - Agent-First API Platform"
      description="Build intelligent applications with ease using Agentive, the agent-first API platform for developers."
    >
      <Joyride
        steps={demoTour}
        run={runTour}
        continuous
        showSkipButton
        showProgress
        styles={{
          options: {
            primaryColor: '#4F46E5',
            zIndex: 1000,
          },
        }}
        callback={handleJoyrideCallback}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 pt-16 pb-24">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Build Intelligent Applications with{' '}
                <span className="text-primary-950 dark:text-primary-400">Agentive</span>
              </h1>
              <p className="text-xl mb-8 text-gray-600 dark:text-gray-300">
                The agent-first API platform that enables developers to create, deploy, and manage AI agents at scale.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={startTour}>
                  Start Demo Tour
                </Button>
                <Link href="/docs">
                  <Button variant="outline" size="lg">
                    View API Docs
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Agentive API Terminal</div>
                </div>
                <div className="font-mono text-sm bg-gray-900 text-green-400 p-4 rounded-lg h-64 overflow-hidden">
                  <p>$ curl -X POST https://api.agentive.ai/v1/agents/create \</p>
                  <p>  -H "X-Bot-ID: your_bot_id" \</p>
                  <p>  -H "X-API-Key: your_api_key" \</p>
                  <p>  -H "Content-Type: application/json" \</p>
                  <p>  -d '&#123;"name": "Research Assistant", "capabilities": ["web_search", "summarize"]&#125;'</p>
                  <p className="mt-2">&#123;</p>
                  <p>  "agent_id": "agt_7f4d8a9b2c1e",</p>
                  <p>  "name": "Research Assistant",</p>
                  <p>  "status": "active",</p>
                  <p>  "capabilities": ["web_search", "summarize"],</p>
                  <p>  "created_at": "2025-04-22T14:04:45Z"</p>
                  <p>&#125;</p>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 bg-primary-950 text-white p-3 rounded-lg shadow-lg animate-pulse-slow">
                <span className="text-sm font-medium">Ready to build</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Features for AI Development</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Everything you need to build, deploy, and scale intelligent applications
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card
              title="Flexible API"
              subtitle="Simple REST API for seamless integration"
              className="card-hover"
              hover
            >
              <p className="text-gray-600 dark:text-gray-300">
                Our RESTful API makes it easy to integrate AI agents into your applications with just a few lines of code.
              </p>
            </Card>

            <Card
              title="Pay-As-You-Go"
              subtitle="Only pay for what you use"
              className="card-hover"
              hover
              id="purchase-credits-section"
            >
              <p className="text-gray-600 dark:text-gray-300">
                Purchase credits and only pay for the API calls you make. No monthly fees or hidden costs.
              </p>
            </Card>

            <Card
              title="Usage Dashboard"
              subtitle="Monitor your API usage in real-time"
              className="card-hover"
              hover
              id="usage-dashboard"
            >
              <p className="text-gray-600 dark:text-gray-300">
                Track your API usage, credit balance, and request history with our interactive dashboard.
              </p>
            </Card>

            <Card
              title="Webhook Integration"
              subtitle="Real-time event notifications"
              className="card-hover"
              hover
              id="webhook-form"
            >
              <p className="text-gray-600 dark:text-gray-300">
                Receive notifications when events occur in your Agentive account with our webhook integration.
              </p>
            </Card>

            <Card
              title="Sandbox Environment"
              subtitle="Test your integration without affecting production"
              className="card-hover"
              hover
              id="sandbox-toggle"
            >
              <p className="text-gray-600 dark:text-gray-300">
                Test your integration in our sandbox environment without affecting your production data or credits.
              </p>
            </Card>

            <Card
              title="Comprehensive Documentation"
              subtitle="Detailed guides and API reference"
              className="card-hover"
              hover
            >
              <p className="text-gray-600 dark:text-gray-300">
                Get started quickly with our comprehensive documentation, including guides and API reference.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* API Key Form Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Get Started with Agentive</h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Enter your API credentials to start building with Agentive
              </p>
            </div>

            <ApiKeyForm id="api-key-form" className="max-w-lg mx-auto" />

            <div className="mt-8 text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Don't have an API key yet? Use our sandbox environment to test the API.
              </p>
              <Link href="/sandbox">
                <Button variant="outline">
                  Try Sandbox Mode
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-950 dark:bg-primary-900">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Build Intelligent Applications?</h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Start building with Agentive today and unlock the power of AI agents in your applications.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="accent" size="lg" onClick={startTour}>
              Start Demo Tour
            </Button>
            <Link href="/docs">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-primary-800">
                View API Docs
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
