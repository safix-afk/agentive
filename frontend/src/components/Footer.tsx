import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container-custom py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand and description */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-primary-950 dark:text-white">Agentive</span>
            </Link>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 max-w-md">
              Agentive is an agent-first API platform that enables developers to build intelligent 
              applications with ease. Our platform provides the tools and infrastructure needed to 
              create, deploy, and manage AI agents at scale.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
              Product
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/purchase" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-950 dark:hover:text-primary-400">
                  Purchase Credits
                </Link>
              </li>
              <li>
                <Link href="/usage" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-950 dark:hover:text-primary-400">
                  Usage Dashboard
                </Link>
              </li>
              <li>
                <Link href="/webhooks" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-950 dark:hover:text-primary-400">
                  Webhooks
                </Link>
              </li>
              <li>
                <Link href="/sandbox" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-950 dark:hover:text-primary-400">
                  Sandbox
                </Link>
              </li>
            </ul>
          </div>

          {/* Documentation */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
              Resources
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/docs" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-950 dark:hover:text-primary-400">
                  API Documentation
                </Link>
              </li>
              <li>
                <a href="https://github.com/agentive/api" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-950 dark:hover:text-primary-400">
                  GitHub
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-950 dark:hover:text-primary-400">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-950 dark:hover:text-primary-400">
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Agentive. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <a href="#" className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300">
                Terms of Service
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
