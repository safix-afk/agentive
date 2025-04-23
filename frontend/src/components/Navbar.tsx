import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { Disclosure, Transition } from '@headlessui/react';
import { SunIcon, MoonIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import SandboxToggle from './SandboxToggle';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Agent', href: '/agent' },
  { name: 'Purchase', href: '/purchase' },
  { name: 'Usage', href: '/usage' },
  { name: 'Webhooks', href: '/webhooks' },
  { name: 'Docs', href: '/docs' },
  { name: 'GraphQL', href: '/graphql-playground' },
];

const Navbar: React.FC = () => {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSandboxBanner, setShowSandboxBanner] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set isClient to true when component mounts
    setIsClient(true);
    
    // Check for user preference in localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
    
    // Check for sandbox mode
    const sandboxMode = localStorage.getItem('sandboxMode') === 'true';
    setShowSandboxBanner(sandboxMode);
    
    // Listen for sandbox mode changes
    const handleSandboxModeChange = (event: CustomEvent) => {
      setShowSandboxBanner(event.detail.sandboxMode);
    };
    
    window.addEventListener('sandboxModeChanged', handleSandboxModeChange as EventListener);
    
    return () => {
      window.removeEventListener('sandboxModeChanged', handleSandboxModeChange as EventListener);
    };
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  return (
    <>
      {showSandboxBanner && isClient && (
        <div className="bg-yellow-500 dark:bg-yellow-600 text-white px-4 py-1 text-center text-sm font-medium">
          Sandbox Mode Active - Using Mock Data
        </div>
      )}
      
      <Disclosure as="nav" className="bg-white dark:bg-gray-900 shadow-sm">
        {({ open }) => (
          <>
            <div className="container-custom">
              <div className="relative flex items-center justify-between h-16">
                {/* Mobile menu button */}
                <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                  <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>

                {/* Logo and desktop navigation */}
                <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
                  <div className="flex-shrink-0 flex items-center">
                    <Link href="/" className="flex items-center">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-xl font-bold text-primary-950 dark:text-white"
                      >
                        Agentive
                      </motion.div>
                    </Link>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
                    {navigation.map((item) => {
                      const isActive = router.pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            isActive
                              ? 'bg-primary-50 text-primary-950 dark:bg-primary-900/20 dark:text-primary-400'
                              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                          }`}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          {item.name}
                          {isActive && (
                            <motion.div
                              className="absolute bottom-0 left-0 h-0.5 w-full bg-primary-950 dark:bg-primary-400"
                              layoutId="navbar-indicator"
                            />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Sandbox toggle and dark mode toggle */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0 space-x-4">
                  <SandboxToggle className="hidden sm:flex" />
                  
                  <button
                    type="button"
                    className="p-1 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    onClick={toggleDarkMode}
                  >
                    <span className="sr-only">Toggle dark mode</span>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={isDarkMode ? 'dark' : 'light'}
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isDarkMode ? (
                          <SunIcon className="h-6 w-6" aria-hidden="true" />
                        ) : (
                          <MoonIcon className="h-6 w-6" aria-hidden="true" />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile menu */}
            <Transition
              show={open}
              as={React.Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Disclosure.Panel className="sm:hidden">
                <div className="px-2 pt-2 pb-3 space-y-1">
                  {navigation.map((item) => {
                    const isActive = router.pathname === item.href;
                    return (
                      <Disclosure.Button
                        key={item.name}
                        as={Link}
                        href={item.href}
                        className={`block px-3 py-2 rounded-md text-base font-medium ${
                          isActive
                            ? 'bg-primary-50 text-primary-950 dark:bg-primary-900/20 dark:text-primary-400'
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {item.name}
                      </Disclosure.Button>
                    );
                  })}
                  
                  {/* Mobile sandbox toggle */}
                  <div className="px-3 py-2">
                    <SandboxToggle />
                  </div>
                </div>
              </Disclosure.Panel>
            </Transition>
          </>
        )}
      </Disclosure>
    </>
  );
};

export default Navbar;
