/**
 * Дашборд статистики продуктивности.
 * Показывает общие метрики, графики прогресса и статистику по проектам.
 */

import React, { useState, useMemo } from 'react';
import { Target, Clock, Award, Activity, BarChart3, PieChart as LucidePieChart } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { AnalyticsUtils, DateUtils } from '../utils';
import { PRIORITY_CONFIG } from '../constants';
import type { Client, FocusSession } from '../types';
import { StatsCard } from './StatsCard';
import { ProgressChart, type MetricType, type ChartDataPoint } from './ProgressChart';

export interface StatsDashboardProps {
  clients: Client[];
  focusSessions: FocusSession[];
  className?: string;
}

type TimeRange = 'week' | 'month' | 'quarter';

export const StatsDashboard = ({
  clients,
  focusSessions,
  className = ''
}: StatsDashboardProps) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('tasks');

  const dateRange = useMemo(() => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    return DateUtils.getDateRange(days);
  }, [timeRange]);

  const stats = useMemo(() => {
    const dailyStats = AnalyticsUtils.calculateDailyStats(clients, focusSessions, dateRange);
    const projectStats = AnalyticsUtils.calculateProjectStats(clients);

    const totalTasks = clients.reduce((acc, client) => acc + client.tasks.length, 0);
    const completedTasks = clients.reduce((acc, client) => acc + client.tasks.filter(t => t.isDone).length, 0);
    const totalFocusTime = focusSessions.reduce((acc, session) => acc + session.duration, 0) / 60;
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

  const chartData: ChartDataPoint[] = useMemo(() => {
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
            Productivity Stats
          </h2>
          <p className="text-secondary mt-1">Analyze your progress and optimize your work</p>
        </div>

        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="bg-surface border border-white/10 text-white px-4 py-2 rounded-lg focus:ring-1 focus:ring-primary/50 outline-none"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last 3 Months</option>
          </select>
        </div>
      </div>

      {/* Общие метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={Target}
          bgColor="bg-primary/20"
          textColor="text-primary"
          title="Tasks Completed"
          value={stats.completedTasks}
          subtitle={`of ${stats.totalTasks} total (${Math.round(stats.completionRate)}%)`}
          delay={0}
        />
        <StatsCard
          icon={Award}
          bgColor="bg-yellow-400/20"
          textColor="text-yellow-400"
          title="Points"
          value={stats.totalPoints}
          subtitle={`Average: ${stats.completedTasks > 0 ? Math.round(stats.totalPoints / stats.completedTasks) : 0} per task`}
          delay={0.1}
        />
        <StatsCard
          icon={Clock}
          bgColor="bg-purple-400/20"
          textColor="text-purple-400"
          title="Focus Time"
          value={`${Math.round(stats.totalFocusTime)} min`}
          subtitle={`${focusSessions.length} sessions`}
          delay={0.2}
        />
        <StatsCard
          icon={Activity}
          bgColor="bg-green-400/20"
          textColor="text-green-400"
          title="Avg Productivity"
          value={dateRange.length > 0 ? Math.round(stats.totalTasks / dateRange.length * 10) / 10 : 0}
          subtitle="tasks per day"
          delay={0.3}
        />
      </div>

      {/* Основной график */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <ProgressChart
          data={chartData}
          selectedMetric={selectedMetric}
          onMetricChange={setSelectedMetric}
        />

        {/* Распределение по приоритетам */}
        <div className="glass p-6 rounded-2xl border border-white/5">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <LucidePieChart size={20} className="text-primary" />
            By Priority
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
                {priorityData.map((_, index) => (
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
          Projects & Completion Speed
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-sm font-medium text-secondary pb-3">Project</th>
                <th className="text-right text-sm font-medium text-secondary pb-3">Total Tasks</th>
                <th className="text-right text-sm font-medium text-secondary pb-3">Completed</th>
                <th className="text-right text-sm font-medium text-secondary pb-3">Progress</th>
                <th className="text-right text-sm font-medium text-secondary pb-3">Speed</th>
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
                      {Math.round(project.avgTaskSpeed * 10) / 10}h
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