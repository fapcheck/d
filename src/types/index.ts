/**
 * Центральный файл экспорта всех типов.
 * Используйте этот файл для импорта типов в компоненты.
 */

// Core types
export type { Priority, Effort, Comment, Task, Client, AppSettings } from './core';
export { DEFAULT_SETTINGS } from './core';

// Analytics types
export type {
    HistoryEntryType,
    HistoryData,
    HistoryEntry,
    FocusSession,
    TaskStats,
    UserStats,
    DailyStats,
    ProductivityHealth,
    HealthFactor,
    Recommendation,
    HealthTrend,
    TimePrediction,
    TaskTypePrediction,
    MilestonePrediction,
    RiskFactor,
    OptimalSchedule,
    ProjectStats,
    BurndownPoint,
    PriorityDistribution,
} from './analytics';

// Gamification types
export type { Achievement, LevelInfo, UserProgress } from './gamification';
