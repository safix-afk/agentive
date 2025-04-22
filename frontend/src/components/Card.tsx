import React from 'react';
import { motion } from 'framer-motion';

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  hover?: boolean;
  onClick?: () => void;
  className?: string;
  id?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  icon,
  hover = false,
  onClick,
  className = '',
  id,
}) => {
  const cardVariants = {
    hover: {
      scale: 1.02,
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  };

  return (
    <motion.div
      id={id}
      className={`card ${hover ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      whileHover={hover ? 'hover' : undefined}
      whileTap={hover && onClick ? 'tap' : undefined}
      variants={cardVariants}
    >
      {(title || icon) && (
        <div className="flex items-start mb-4">
          {icon && <div className="mr-4 text-primary-950 dark:text-primary-400">{icon}</div>}
          <div>
            {title && <h3 className="text-lg font-semibold">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
          </div>
        </div>
      )}
      <div>{children}</div>
    </motion.div>
  );
};

export default Card;
