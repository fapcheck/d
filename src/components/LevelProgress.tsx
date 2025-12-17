import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { LEVELS, GamificationUtils } from '../types';

interface LevelProgressProps {
  points: number;
  level: number;
  className?: string;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({ 
  points, 
  level, 
  className = '' 
}) => {
  const currentLevel = LEVELS.find(l => l.level === level) || LEVELS[0];
  const nextLevel = LEVELS.find(l => l.level === level + 1);
  const progress = GamificationUtils.getProgressToNextLevel(points, level);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <motion.div 
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-white/10"
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex items-center gap-1">
          {[...Array(level)].map((_, i) => (
            <Star key={i} size={16} className={`${currentLevel.color}`} fill="currentColor" />
          ))}
        </div>
        <div className="text-sm">
          <div className={`font-bold ${currentLevel.color}`}>
            {currentLevel.name}
          </div>
          <div className="text-xs text-secondary">
            {points} очков
          </div>
        </div>
      </motion.div>

      {nextLevel && (
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-xs text-secondary mb-1">
            <span>До {nextLevel.name}</span>
            <span>{progress.current}/{progress.next}</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.progress}%` }}
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      )}
    </div>
  );
};