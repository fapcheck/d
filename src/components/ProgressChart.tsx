/**
 * Линейный график прогресса с переключателем метрик.
 */

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from '../constants';

type MetricType = 'tasks' | 'points' | 'time';

interface ChartDataPoint {
    date: string;
    tasks: number;
    points: number;
    time: number;
    sessions: number;
}

interface ProgressChartProps {
    data: ChartDataPoint[];
    selectedMetric: MetricType;
    onMetricChange: (metric: MetricType) => void;
}

/**
 * График динамики прогресса с возможностью переключения между метриками.
 */
export const ProgressChart: React.FC<ProgressChartProps> = ({
    data,
    selectedMetric,
    onMetricChange
}) => {
    return (
        <div className="lg:col-span-2 glass p-6 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Динамика прогресса</h3>
                <div className="flex gap-2">
                    {(['tasks', 'points', 'time'] as const).map(metric => (
                        <button
                            key={metric}
                            onClick={() => onMetricChange(metric)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${selectedMetric === metric
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
                <LineChart data={data}>
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
    );
};

export type { MetricType, ChartDataPoint };
