import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Clock, TrendingUp, AlertTriangle, Target, Calendar, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TimePrediction, Client } from '../types';

interface TimePredictionProps {
  client: Client;
  prediction: TimePrediction;
  className?: string;
}

export const TimePredictionCard: React.FC<TimePredictionProps> = ({
  client,
  prediction,
  className = ''
}) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'text-green-400';
    if (confidence >= 0.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.7) return 'Высокая';
    if (confidence >= 0.5) return 'Средняя';
    return 'Низкая';
  };

  const getRiskColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-400 bg-red-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  // Данные для графика вех
  const milestonesData = prediction.milestones.map((milestone, index) => ({
    name: milestone.name,
    date: formatDate(milestone.estimatedDate),
    tasks: milestone.tasksCompleted,
    confidence: milestone.confidence * 100,
    fullName: milestone.name
  }));

  return (
    <div className={`glass p-6 rounded-2xl border border-white/5 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-400/20 rounded-xl flex items-center justify-center">
          <Brain className="text-purple-400" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Прогноз времени</h3>
          <p className="text-sm text-secondary">Проект: {client.name}</p>
        </div>
      </div>

      {/* Общий прогноз */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-bg/50 p-4 rounded-xl border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-primary" />
            <span className="text-sm font-medium text-secondary">Время</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {Math.round(prediction.totalEstimatedHours)}ч
          </div>
          <div className="text-xs text-secondary mt-1">
            ≈ {Math.round(prediction.totalEstimatedHours / 8)} рабочих дней
          </div>
        </div>

        <div className="bg-bg/50 p-4 rounded-xl border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-success" />
            <span className="text-sm font-medium text-secondary">Точность</span>
          </div>
          <div className={`text-2xl font-bold ${getConfidenceColor(prediction.confidence)}`}>
            {Math.round(prediction.confidence * 100)}%
          </div>
          <div className="text-xs text-secondary mt-1">
            {getConfidenceLabel(prediction.confidence)} уверенность
          </div>
        </div>

        <div className="bg-bg/50 p-4 rounded-xl border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-accent" />
            <span className="text-sm font-medium text-secondary">Завершение</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {prediction.milestones.length > 0 
              ? formatDate(prediction.milestones[prediction.milestones.length - 1].estimatedDate)
              : 'Неизвестно'
            }
          </div>
          <div className="text-xs text-secondary mt-1">
            Предполагаемая дата
          </div>
        </div>
      </div>

      {/* Разбивка по типам задач */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-secondary uppercase tracking-wide mb-3">
          Разбивка по типам задач
        </h4>
        <div className="space-y-2">
          {prediction.breakdown.map((item, index) => (
            <motion.div
              key={`${item.priority}-${item.effort}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-bg/30 rounded-lg border border-white/5"
            >
              <div>
                <div className="text-sm font-medium text-white">
                  {item.priority === 'high' ? 'Высокий' : item.priority === 'normal' ? 'Обычный' : 'Низкий'} приоритет • {' '}
                  {item.effort === 'quick' ? 'Быстро' : item.effort === 'medium' ? 'Средне' : 'Долго'}
                </div>
                <div className="text-xs text-secondary">
                  {item.count} задач • {Math.round(item.avgHoursPerTask * 10) / 10}ч/задача
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white">
                  {Math.round(item.totalHours)}ч
                </div>
                <div className={`text-xs ${getConfidenceColor(item.confidence)}`}>
                  {Math.round(item.confidence * 100)}%
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* График вех */}
      {milestonesData.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-secondary uppercase tracking-wide mb-3">
            Прогресс по вехам
          </h4>
          <div className="bg-bg/30 p-4 rounded-xl border border-white/5">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={milestonesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9ca3af" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: any, name: any) => [
                    name === 'tasks' ? `${value} задач` : `${value}%`,
                    name === 'tasks' ? 'Задач выполнено' : 'Уверенность'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="tasks" 
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Факторы риска */}
      {prediction.riskFactors.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-secondary uppercase tracking-wide mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-yellow-400" />
            Факторы риска
          </h4>
          <div className="space-y-2">
            {prediction.riskFactors.map((risk, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 bg-yellow-400/5 border border-yellow-400/20 rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`px-2 py-1 rounded text-xs font-bold ${getRiskColor(risk.impact)}`}>
                    {risk.impact === 'high' ? 'Высокий' : risk.impact === 'medium' ? 'Средний' : 'Низкий'} риск
                  </div>
                  <div className="text-xs text-secondary">
                    {Math.round(risk.probability * 100)}%
                  </div>
                </div>
                <div className="text-sm text-white mb-1">{risk.description}</div>
                <div className="text-xs text-secondary">
                  <strong>Решение:</strong> {risk.mitigation}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};