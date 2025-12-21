/**
 * Константы приложения ZenManager.
 * Уровни, достижения, конфигурации приоритетов и сложности.
 */

import { Zap, Clock, Coffee, Trophy, Star, Target, Calendar, CheckCircle, Heart, Activity, AlertTriangle, Brain } from 'lucide-react';
import type { LevelInfo, Achievement } from '../types/gamification';

/** Определения уровней пользователя */
export const LEVELS: LevelInfo[] = [
    { level: 1, name: 'Новичок', minPoints: 0, color: 'text-gray-400' },
    { level: 2, name: 'Ученик', minPoints: 100, color: 'text-blue-400' },
    { level: 3, name: 'Практик', minPoints: 300, color: 'text-green-400' },
    { level: 4, name: 'Мастер', minPoints: 600, color: 'text-yellow-400' },
    { level: 5, name: 'Легенда', minPoints: 1000, color: 'text-purple-400' },
    { level: 6, name: 'Гуру', minPoints: 1500, color: 'text-pink-400' },
];

/** Доступные достижения */
export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'first_task',
        name: 'Первая кровь',
        description: 'Выполните первую задачу',
        icon: CheckCircle,
        progress: 0,
        target: 1,
        category: 'tasks'
    },
    {
        id: 'task_master_10',
        name: 'Мастер задач',
        description: 'Выполните 10 задач',
        icon: Target,
        progress: 0,
        target: 10,
        category: 'tasks'
    },
    {
        id: 'task_master_50',
        name: 'Легенда задач',
        description: 'Выполните 50 задач',
        icon: Trophy,
        progress: 0,
        target: 50,
        category: 'tasks'
    },
    {
        id: 'task_master_100',
        name: 'Повелитель задач',
        description: 'Выполните 100 задач',
        icon: Star,
        progress: 0,
        target: 100,
        category: 'tasks'
    },
    {
        id: 'streak_3',
        name: 'Начало пути',
        description: '3 дня подряд без прокрастинации',
        icon: Calendar,
        progress: 0,
        target: 3,
        category: 'streak'
    },
    {
        id: 'streak_7',
        name: 'Неделя силы',
        description: '7 дней подряд',
        icon: Calendar,
        progress: 0,
        target: 7,
        category: 'streak'
    },
    {
        id: 'streak_30',
        name: 'Месяц мастера',
        description: '30 дней подряд',
        icon: Calendar,
        progress: 0,
        target: 30,
        category: 'streak'
    },
    {
        id: 'focus_60',
        name: 'Фокус-час',
        description: 'Наработайте 60 минут в фокусе',
        icon: Clock,
        progress: 0,
        target: 60,
        category: 'time'
    },
    {
        id: 'focus_300',
        name: 'Мастер фокуса',
        description: 'Наработайте 5 часов в фокусе',
        icon: Clock,
        progress: 0,
        target: 300,
        category: 'time'
    },
    {
        id: 'perfect_week',
        name: 'Идеальная неделя',
        description: 'Неделя без просроченных задач',
        icon: Star,
        progress: 0,
        target: 7,
        category: 'special'
    }
];

/** Конфигурация приоритетов */
export const PRIORITY_CONFIG = {
    high: {
        label: 'Высокий',
        icon: '🔥',
        color: 'text-error',
        indicator: 'bg-error',
        border: 'border-error',
        bg: 'bg-error/20',
        weight: 3,
        points: 30
    },
    normal: {
        label: 'Обычный',
        icon: '🔹',
        color: 'text-primary',
        indicator: 'bg-primary',
        border: 'border-primary',
        bg: 'bg-primary/20',
        weight: 2,
        points: 20
    },
    low: {
        label: 'Низкий',
        icon: '☕',
        color: 'text-success',
        indicator: 'bg-success',
        border: 'border-success',
        bg: 'bg-success/20',
        weight: 1,
        points: 10
    },
} as const;

/** Конфигурация сложности задач */
export const EFFORT_CONFIG = {
    quick: { label: '5 мин', icon: Zap, color: 'text-warning' },
    medium: { label: '30 мин', icon: Clock, color: 'text-primary' },
    long: { label: 'Долго', icon: Coffee, color: 'text-accent' },
} as const;

/** Имя файла базы данных */
export const DB_FILENAME = 'zen-db.json';

/** Цвета для графиков */
export const CHART_COLORS = {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    gray: '#6b7280'
} as const;

/** Конфигурация аналитики */
export const ANALYTICS_CONFIG = {
    dateRange: {
        week: 7,
        month: 30,
        quarter: 90
    },
    focusSession: {
        minDuration: 5 * 60,
        maxDuration: 8 * 60 * 60
    }
} as const;

/** Уровни здоровья продуктивности */
export const HEALTH_LEVELS = {
    excellent: {
        min: 80,
        color: 'text-green-400',
        bg: 'bg-green-400/20',
        icon: Heart,
        description: 'Отличное состояние'
    },
    good: {
        min: 60,
        color: 'text-blue-400',
        bg: 'bg-blue-400/20',
        icon: Activity,
        description: 'Хорошее состояние'
    },
    warning: {
        min: 40,
        color: 'text-yellow-400',
        bg: 'bg-yellow-400/20',
        icon: AlertTriangle,
        description: 'Требует внимания'
    },
    critical: {
        min: 0,
        color: 'text-red-400',
        bg: 'bg-red-400/20',
        icon: Brain,
        description: 'Критическое состояние'
    },
} as const;
