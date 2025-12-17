import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { Achievement } from '../types';

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({ 
  achievement, 
  size = 'md',
  showProgress = true 
}) => {
  const isUnlocked = !!achievement.unlockedAt;
  const Icon = achievement.icon;
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  };
  
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 28
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`
        relative rounded-full border-2 flex items-center justify-center transition-all duration-300
        ${isUnlocked 
          ? 'bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border-yellow-400/50 shadow-lg shadow-yellow-400/20' 
          : 'bg-gray-800/50 border-gray-600/50'
        }
        ${sizeClasses[size]}
      `}
      title={`${achievement.name} - ${achievement.description}`}
    >
      <Icon 
        size={iconSizes[size]} 
        className={isUnlocked ? 'text-yellow-400' : 'text-gray-500'} 
      />
      
      {isUnlocked && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
        >
          <Check size={10} className="text-white" />
        </motion.div>
      )}
      
      {showProgress && !isUnlocked && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="w-6 h-1 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};