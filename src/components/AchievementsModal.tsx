import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Target, Calendar, Clock, Star } from 'lucide-react';
import { ACHIEVEMENTS } from '../types';
import { AchievementBadge } from './AchievementBadge';
import type { Achievement } from '../types';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: Achievement[];
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  achievements
}) => {
  if (!isOpen) return null;

  const unlockedCount = achievements.filter(a => a.unlockedAt).length;
  const totalCount = achievements.length;

  const categories = [
    { id: 'tasks', name: 'Задачи', icon: Target, color: 'text-blue-400' },
    { id: 'streak', name: 'Серии', icon: Calendar, color: 'text-green-400' },
    { id: 'time', name: 'Время', icon: Clock, color: 'text-purple-400' },
    { id: 'special', name: 'Особые', icon: Star, color: 'text-yellow-400' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-surface border border-white/10 w-full max-w-4xl rounded-3xl shadow-2xl relative z-10 max-h-[80vh] flex flex-col"
      >
        <div className="flex justify-between items-center p-6 border-b border-white/5">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="text-yellow-400" size={28} />
              Достижения
            </h2>
            <p className="text-secondary text-sm mt-1">
              {unlockedCount} из {totalCount} получено
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-secondary transition-colors">
            <X size={20}/>
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Общий прогресс */}
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Прогресс</h3>
              <span className="text-sm text-secondary">
                {Math.round((unlockedCount / totalCount) * 100)}%
              </span>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Список достижений по категориям */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {categories.map(category => {
              const categoryAchievements = achievements.filter(a => a.category === category.id);
              const unlockedInCategory = categoryAchievements.filter(a => a.unlockedAt).length;
              
              if (categoryAchievements.length === 0) return null;

              return (
                <div key={category.id}>
                  <div className="flex items-center gap-3 mb-4">
                    <category.icon size={20} className={category.color} />
                    <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                    <span className="text-sm text-secondary">
                      {unlockedInCategory}/{categoryAchievements.length}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <AnimatePresence>
                      {categoryAchievements.map((achievement) => (
                        <motion.div
                          key={achievement.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-bg/50 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all"
                        >
                          <div className="text-center">
                            <AchievementBadge achievement={achievement} size="lg" />
                            
                            <h4 className={`mt-3 font-semibold text-sm ${achievement.unlockedAt ? 'text-white' : 'text-gray-400'}`}>
                              {achievement.name}
                            </h4>
                            
                            <p className="text-xs text-secondary mt-1 leading-tight">
                              {achievement.description}
                            </p>
                            
                            <div className="mt-3 text-xs">
                              {achievement.unlockedAt ? (
                                <span className="text-green-400 font-medium">
                                  Получено!
                                </span>
                              ) : (
                                <span className="text-gray-400">
                                  {achievement.progress}/{achievement.target}
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};