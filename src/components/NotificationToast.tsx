import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';
import type { Achievement } from '../types';

interface NotificationToastProps {
  achievement: Achievement;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  achievement,
  onClose
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const Icon = achievement.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      className="fixed top-4 right-4 z-50 bg-surface border border-yellow-400/50 rounded-2xl p-4 shadow-2xl max-w-sm"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full border border-yellow-400/50 flex items-center justify-center">
          <Trophy size={24} className="text-yellow-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-white text-sm">Новое достижение!</h3>
            <button
              onClick={onClose}
              className="text-secondary hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          
          <p className="text-yellow-400 font-semibold text-sm">
            {achievement.name}
          </p>
          
          <p className="text-secondary text-xs mt-1">
            {achievement.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
};