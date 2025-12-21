/**
 * Типы для аналитики и прогнозирования.
 * Включает статистику, здоровье продуктивности и предсказания.
 */

import type { Priority, Effort, Task, Client } from './core';

/** Записи истории действий */
export type HistoryEntryType =
    | 'task_create'
    | 'task_complete'
    | 'task_delete'
    | 'task_update'
    | 'client_add'
    | 'client_remove'
    | 'client_update';

/** Данные для записи истории */
export type HistoryData =
    | Task // full task for create/delete/restore
    | Client // full client for add/remove/restore
    | { title: string; priority: Priority; effort: Effort; clientIds?: number[] } // batch task create
    | { isDone: boolean } // task completion toggle
    | { id: number; name: string; priority: Priority } // legacy client
    | { previousValue?: unknown; newValue?: unknown } // generic updates
    | Record<string, unknown>; // fallback

export interface HistoryEntry {
    id: number;
    timestamp: number;
    type: HistoryEntryType;
    data: HistoryData;
    description: string;
    userId: string;
    clientId?: number | string;
    taskId?: number | string;
}

/** Фокус-сессия работы */
export interface FocusSession {
    id: number | string;
    clientId: number | string;
    taskId?: number | string;
    startTime: number;
    endTime?: number;
    /** Длительность в секундах */
    duration: number;
    wasCompleted: boolean;
}

/** Статистика по задачам */
export interface TaskStats {
    total: number;
    completed: number;
    /** Среднее время выполнения в часах */
    avgCompletionTime: number;
    /** Процент выполнения */
    completionRate: number;
    byPriority: Record<Priority, number>;
    byEffort: Record<Effort, number>;
}

/** Статистика пользователя */
export interface UserStats {
    totalTasksCompleted: number;
    currentStreak: number;
    maxStreak: number;
    /** Общее время фокуса в минутах */
    totalFocusTime: number;
    tasksThisWeek: number;
    tasksThisMonth: number;
    perfectDays: number;
    averageTasksPerDay: number;
    bestDay: { date: string; tasks: number };
    consistencyScore: number;
    avgSessionDuration: number;
    peakPerformanceHours: number[];
}

/** Дневная статистика */
export interface DailyStats {
    /** Формат: YYYY-MM-DD */
    date: string;
    tasksCompleted: number;
    pointsEarned: number;
    /** Время фокуса в минутах */
    focusTime: number;
    sessionsCount: number;
}

/** Здоровье продуктивности */
export interface ProductivityHealth {
    /** Оценка 0-100 */
    score: number;
    level: 'excellent' | 'good' | 'warning' | 'critical';
    factors: HealthFactor[];
    recommendations: Recommendation[];
    trends: HealthTrend;
}

export interface HealthFactor {
    name: string;
    score: number;
    weight: number;
    status: 'positive' | 'negative' | 'neutral';
    description: string;
}

export interface Recommendation {
    id: string;
    type: 'break' | 'planning' | 'task_management' | 'schedule';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    action: string;
}

export interface HealthTrend {
    direction: 'improving' | 'stable' | 'declining';
    change: number;
    period: 'week' | 'month';
    prediction: {
        nextWeek: number;
        confidence: number;
    };
}

/** Предсказание времени для проекта */
export interface TimePrediction {
    projectId: number;
    totalEstimatedHours: number;
    confidence: number;
    breakdown: TaskTypePrediction[];
    milestones: MilestonePrediction[];
    riskFactors: RiskFactor[];
    optimalSchedule: OptimalSchedule[];
}

export interface TaskTypePrediction {
    priority: Priority;
    effort: Effort;
    count: number;
    avgHoursPerTask: number;
    totalHours: number;
    confidence: number;
}

export interface MilestonePrediction {
    name: string;
    estimatedDate: number;
    tasksCompleted: number;
    totalTasks: number;
    confidence: number;
}

export interface RiskFactor {
    type: 'overdue' | 'complexity' | 'capacity' | 'dependencies';
    description: string;
    impact: 'low' | 'medium' | 'high';
    probability: number;
    mitigation: string;
}

export interface OptimalSchedule {
    /** 0-6, 0 = воскресенье */
    dayOfWeek: number;
    /** 0-23 */
    hour: number;
    recommendedTasks: number;
    focusScore: number;
}

/** Статистика проекта */
export interface ProjectStats {
    clientId: number;
    clientName: string;
    totalTasks: number;
    completedTasks: number;
    burndownData: BurndownPoint[];
    priorityDistribution: PriorityDistribution[];
    /** Часы на задачу */
    avgTaskSpeed: number;
}

export interface BurndownPoint {
    /** Формат: YYYY-MM-DD */
    date: string;
    ideal: number;
    actual: number;
    targetDate?: string;
}

export interface PriorityDistribution {
    priority: Priority;
    count: number;
    percentage: number;
    /** В часах */
    avgTimeSpent: number;
}
