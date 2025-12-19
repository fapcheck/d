/**
 * Типы для системы геймификации.
 * Включает достижения, уровни и прогресс пользователя.
 */

import type { LucideIcon } from 'lucide-react';
import type { FocusSession, HistoryEntry, TimePrediction, ProductivityHealth, UserStats } from './analytics';

/** Достижение пользователя */
export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    unlockedAt?: number;
    progress: number;
    target: number;
    category: 'tasks' | 'streak' | 'time' | 'special';
}

/** Информация об уровне */
export interface LevelInfo {
    level: number;
    name: string;
    minPoints: number;
    color: string;
}

/** Полный прогресс пользователя */
export interface UserProgress {
    totalPoints: number;
    level: number;
    currentLevelPoints: number;
    nextLevelPoints: number;
    achievements: Achievement[];
    stats: UserStats;
    focusSessions: FocusSession[];
    productivityHealth: ProductivityHealth;
    history: HistoryEntry[];
    timePredictions: TimePrediction[];
}
