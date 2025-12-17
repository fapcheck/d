import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Calendar, Target, Clock, Award, BarChart3, 
  PieChart as LucidePieChart, Activity, Zap, Filter 
} from 'lucide-react';
// Добавил импорт Pie
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
         BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { AnalyticsUtils, DateUtils, PRIORITY_CONFIG, CHART_COLORS } from '../types';
import type { Client, FocusSession, DailyStats, ProjectStats } from '../types';

interface StatsDashboardProps {
  clients: Client[];
  focusSessions: FocusSession[];
  className?: string;
}

type TimeRange = 'week' | 'month' | 'quarter';

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ 
  clients, 
  focusSessions, 
  className = '' 
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [selectedMetric, setSelectedMetric] = useState<'tasks' | 'points' | 'time'>('tasks');
  
  const dateRange = useMemo(() => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    return DateUtils.getDateRange(days);
  }, [timeRange]);
  
  const stats = useMemo(() => {
    const dailyStats = AnalyticsUtils.calculateDailyStats(clients, focusSessions, dateRange);
    const projectStats = AnalyticsUtils.calculateProjectStats(clients);
    
    // Общая статистика
    const totalTasks = clients.reduce((acc, client) => acc + client.tasks.length, 0);
    const completedTasks = clients.reduce((acc, client) => acc + client.tasks.filter(t => t.isDone).length, 0);
    const totalFocusTime = focusSessions.reduce((acc, session) => acc + session.duration, 0) / 60; // в минутах
    const totalPoints = clients.reduce((acc, client) => 
      acc + client.tasks.filter(t => t.isDone).reduce((sum, task) => sum + (task.pointsEarned || 0), 0), 0
    );
    
    return {
      dailyStats,
      projectStats,
      totalTasks,
      completedTasks,
      totalFocusTime,
      totalPoints,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    };
  }, [clients, focusSessions, dateRange]);
  
  const chartData = useMemo(() => {
    return stats.dailyStats.map(day => ({
      date: new Date(day.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      tasks: day.tasksCompleted,
      points: day.pointsEarned,
      time: Math.round(day.focusTime),
      sessions: day.sessionsCount
    }));
  }, [stats.dailyStats]);
  
  const priorityData = useMemo(() => {
    const priorityStats = {
      high: clients.reduce((acc, client) => acc + client.tasks.filter(t => t.priority === 'high' && t.isDone).length, 0),
      normal: clients.reduce((acc, client) => acc + client.tasks.filter(t => t.priority === 'normal' && t.isDone).length, 0),
      low: clients.reduce((acc, client) => acc + client.tasks.filter(t => t.priority === 'low' && t.isDone).length, 0),
    };
    
    return Object.entries(priorityStats).map(([priority, count]) => ({
      name: PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG].label,
      value: count,
      color: PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG].indicator.replace('bg-', '')
    }));
  }, [clients]);
  
  const COLORS = ['#ef4444', '#3b82f6', '#10b981'];

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Заголовок с фильтрами */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-primary" size={28} />
            Статистика продуктивности
          </h2>
          <p className="text-secondary mt-1">Анализируйте свой прогресс и оптимизируйте работу</p>
        </div>
        
        <div className="flex gap-3">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="bg-surface border border-white/10 text-white px-4 py-2 rounded-lg focus:ring-1 focus:ring-primary/50 outline-none"
          >
            <option value="week">Последняя неделя</option>
            <option value="month">Последний месяц</option>
            <option value="quarter">Последние 3 месяца</option>
          </select>
        </div>
      </div>

      {/* Общие метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 rounded-2xl border border-white/5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <Target className="text-primary" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-secondary">Выполнено задач</h3>
              <p className="text-2xl font-bold text-white">{stats.completedTasks}</p>
            </div>
          </div>
          <div className="text-sm text-secondary">
            из {stats.totalTasks} всего ({Math.round(stats.completionRate)}%)
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-6 rounded-2xl border border-white/5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-400/20 rounded-xl flex items-center justify-center">
              <Award className="text-yellow-400" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-secondary">Очки</h3>
              <p className="text-2xl font-bold text-white">{stats.totalPoints}</p>
            </div>
          </div>
          <div className="text-sm text-secondary">
            Среднее: {stats.completedTasks > 0 ? Math.round(stats.totalPoints / stats.completedTasks) : 0} за задачу
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass p-6 rounded-2xl border border-white/5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-400/20 rounded-xl flex items-center justify-center">
              <Clock className="text-purple-400" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-secondary">Время в фокусе</h3>
              <p className="text-2xl font-bold text-white">{Math.round(stats.totalFocusTime)} мин</p>
            </div>
          </div>
          <div className="text-sm text-secondary">
            {focusSessions.length} сессий
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass p-6 rounded-2xl border border-white/5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-400/20 rounded-xl flex items-center justify-center">
              <Activity className="text-green-400" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-secondary">Средняя продуктивность</h3>
              <p className="text-2xl font-bold text-white">
                {dateRange.length > 0 ? Math.round(stats.totalTasks / dateRange.length * 10) / 10 : 0}
              </p>
            </div>
          </div>
          <div className="text-sm text-secondary">
            задач в день
          </div>
        </motion.div>
      </div>

      {/* Основной график */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-6 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Динамика прогресса</h3>
            <div className="flex gap-2">
              {(['tasks', 'points', 'time'] as const).map(metric => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    selectedMetric === metric 
                      ? 'bg-primary/20 text-primary' 
                      : 'text-secondary hover:text-white hover:bg-white/5'
                  }`}
                >
                  {metric === 'tasks' ? 'Задачи' : metric === 'points' ? 'Очки' : 'Время'}
                </button>
              ))}
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
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
              />
              <Line 
                type="monotone" 
                dataKey={selectedMetric} 
                stroke={CHART_COLORS.primary}
                strokeWidth={3}
                dot={{ fill: CHART_COLORS.primary, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: CHART_COLORS.primary, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Распределение по приоритетам */}
        <div className="glass p-6 rounded-2xl border border-white/5">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <LucidePieChart size={20} className="text-primary" />
            По приоритетам
          </h3>
          
          <ResponsiveContainer width="100%" height={200}>
            <RechartsPieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
          
          <div className="space-y-2 mt-4">
            {priorityData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-sm text-secondary">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Статистика по проектам */}
      <div className="glass p-6 rounded-2xl border border-white/5">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Target size={20} className="text-primary" />
          Проекты и скорость выполнения
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-sm font-medium text-secondary pb-3">Проект</th>
                <th className="text-right text-sm font-medium text-secondary pb-3">Всего задач</th>
                <th className="text-right text-sm font-medium text-secondary pb-3">Выполнено</th>
                <th className="text-right text-sm font-medium text-secondary pb-3">Прогресс</th>
                <th className="text-right text-sm font-medium text-secondary pb-3">Скорость</th>
              </tr>
            </thead>
            <tbody>
              {stats.projectStats.map((project) => (
                <tr key={project.clientId} className="border-b border-white/5">
                  <td className="py-3">
                    <div className="font-medium text-white">{project.clientName}</div>
                  </td>
                  <td className="text-right text-secondary py-3">{project.totalTasks}</td>
                  <td className="text-right text-secondary py-3">{project.completedTasks}</td>
                  <td className="text-right py-3">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500"
                          style={{ 
                            width: `${project.totalTasks > 0 ? (project.completedTasks / project.totalTasks) * 100 : 0}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm text-secondary min-w-[3rem]">
                        {project.totalTasks > 0 ? Math.round((project.completedTasks / project.totalTasks) * 100) : 0}%
                      </span>
                    </div>
                  </td>
                  <td className="text-right py-3">
                    <span className="text-secondary">
                      {Math.round(project.avgTaskSpeed * 10) / 10}ч
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};