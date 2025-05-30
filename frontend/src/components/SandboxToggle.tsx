import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SandboxToggleProps {
  className?: string;
}

const SandboxToggle: React.FC<SandboxToggleProps> = ({ className = '' }) => {
  const [sandboxMode, setSandboxMode] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true when component mounts
  useEffect(() => {
    setIsClient(true);
    
    // Check for sandbox mode in localStorage
    const storedSandboxMode = localStorage.getItem('sandboxMode');
    if (storedSandboxMode !== null) {
      setSandboxMode(storedSandboxMode === 'true');
    }
  }, []);

  // Save sandbox mode to localStorage when it changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('sandboxMode', sandboxMode.toString());
      
      // Dispatch a custom event so other components can react to the change
      const event = new CustomEvent('sandboxModeChanged', { detail: { sandboxMode } });
      window.dispatchEvent(event);
    }
  }, [sandboxMode, isClient]);

  const toggleSandboxMode = () => {
    setSandboxMode(!sandboxMode);
  };

  return (
    <div className={`flex items-center ${className}`}>
      <label
        className="relative inline-flex items-center cursor-pointer"
        htmlFor="sandbox-toggle"
      >
        <input
          id="sandbox-toggle"
          type="checkbox"
          checked={sandboxMode}
          onChange={toggleSandboxMode}
          className="sr-only peer"
          aria-label={sandboxMode ? "Disable Sandbox Mode" : "Enable Sandbox Mode"}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
          Sandbox
        </span>
      </label>
      
      {sandboxMode && isClient && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-16 right-4 z-50 p-2 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100 text-xs rounded-md shadow-md"
        >
          Sandbox Mode Active
        </motion.div>
      )}
    </div>
  );
};

export default SandboxToggle;
