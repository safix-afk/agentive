import React from 'react';
import { motion } from 'framer-motion';

interface TourStepProps {
  title: string;
  content: string;
  isActive?: boolean;
  onClose?: () => void;
  onNext?: () => void;
  onBack?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  step?: number;
  totalSteps?: number;
}

const TourStep: React.FC<TourStepProps> = ({
  title,
  content,
  isActive = true,
  onClose,
  onNext,
  onBack,
  isFirst = false,
  isLast = false,
  step = 1,
  totalSteps = 5,
}) => {
  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  if (!isActive) return null;

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-5 max-w-sm"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={variants}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Step {step} of {totalSteps}
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
          aria-label="Close"
          title="Close tour"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{content}</p>

      <div className="flex justify-between">
        <div>
          {!isFirst && (
            <button
              onClick={onBack}
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-950 dark:hover:text-primary-400 focus:outline-none"
            >
              Back
            </button>
          )}
        </div>
        <div>
          <button
            onClick={onNext}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-950 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {isLast ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default TourStep;
