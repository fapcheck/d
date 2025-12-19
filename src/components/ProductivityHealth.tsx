import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Activity, AlertTriangle, Brain, TrendingUp, TrendingDown, Minus, Clock, Target, Calendar } from 'lucide-react';
import { HEALTH_LEVELS } from '../constants';
import type { ProductivityHealth } from '../types';

interface ProductivityHealthProps {
  health: ProductivityHealth;
  className?: string;
}

export const ProductivityHealthIndicator: React.FC<ProductivityHealthProps> = ({
  health,
  className = ''
}) => {
  const healthLevel = HEALTH_LEVELS[health.level];
  const Icon = healthLevel.icon;

  const getTrendIcon = () => {
    switch (health.trends.direction) {
      case 'improving':
        return <TrendingUp size={16} className="text-green-400" />;
      case 'declining':
        return <TrendingDown size={16} className="text-red-400" />;
      default:
        return <Minus size={16} className="text-gray-400" />;
    }
  };

  const getFactorIcon = (status: 'positive' | 'negative' | 'neutral') => {
    switch (status) {
      case 'positive':
        return <Heart size={12} className="text-green-400" />;
      case 'negative':
        return <AlertTriangle size={12} className="text-red-400" />;
      default:
        return <Activity size={12} className="text-gray-400" />;
    }
  };

  return (
    <div className={`glass p-6 rounded-2xl border border-white/5 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 ${healthLevel.bg} rounded-xl flex items-center justify-center`}>
            <Icon size={24} className={healthLevel.color} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Здоровье продуктивности</h3>
            <p className="text-sm text-secondary">{healthLevel.description}</p>
          </div>
        </div>

        <div className="text-right">
          <div className={`text-3xl font-bold ${healthLevel.color}`}>
            {health.score}
          </div>
          <div className="flex items-center gap-1 mt-1">
            {getTrendIcon()}
            <span className="text-xs text-secondary">
              {health.trends.direction === 'improving' ? 'Улучшается' :
                health.trends.direction === 'declining' ? 'Ухудшается' : 'Стабильно'}
            </span>
          </div>
        </div>
      </div>

      {/* Прогресс-бар общего здоровья */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-secondary">Общий балл</span>
          <span className="text-sm font-medium text-white">{health.score}/100</span>
        </div>
        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${health.score}%` }}
            className={`h-full ${healthLevel.bg.replace('/20', '')} transition-all duration-1000`}
          />
        </div>
      </div>

      {/* Факторы здоровья */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-medium text-secondary uppercase tracking-wide">Факторы</h4>
        {health.factors.map((factor, index) => (
          <motion.div
            key={factor.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 bg-bg/50 rounded-lg border border-white/5"
          >
            <div className="flex items-center gap-3">
              {getFactorIcon(factor.status)}
              <div>
                <div className="text-sm font-medium text-white">{factor.name}</div>
                <div className="text-xs text-secondary">{factor.description}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-white">{Math.round(factor.score)}</div>
              <div className="text-xs text-secondary">
                вес {Math.round(factor.weight * 100)}%
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Рекомендации */}
      {health.recommendations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-secondary uppercase tracking-wide">Рекомендации</h4>
          {health.recommendations.map((rec, index) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (health.factors.length * 0.1) + (index * 0.1) }}
              className="p-3 bg-primary/5 border border-primary/10 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${rec.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                    rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                  }`}>
                  {rec.priority === 'high' ? '!' : rec.priority === 'medium' ? '•' : '○'}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{rec.title}</div>
                  <div className="text-xs text-secondary mt-1">{rec.description}</div>
                  <div className="text-xs text-primary mt-1">{rec.action}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};