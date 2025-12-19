/**
 * Утилиты для системы геймификации.
 * Управляет уровнями, очками и достижениями.
 */

import type { Priority, Effort } from '../types/core';
import type { Achievement, UserStats } from '../types';
import { LEVELS, PRIORITY_CONFIG } from '../constants';

/** Возвращает информацию об уровне на основе накопленных очков */
export const getLevelByPoints = (points: number) => {
    let currentLevel = LEVELS[0];
    for (const level of LEVELS) {
        if (points >= level.minPoints) {
            currentLevel = level;
        } else {
            break;
        }
    }
    return currentLevel;
};

/** Возвращает количество очков, необходимых для следующего уровня */
export const getNextLevelPoints = (currentLevel: number): number => {
    const current = LEVELS.find(l => l.level === currentLevel);
    const next = LEVELS.find(l => l.level === currentLevel + 1);
    return next ? next.minPoints : current?.minPoints || 0;
};

/** 
 * Рассчитывает прогресс до следующего уровня.
 * @returns Объект с текущими очками, необходимыми очками и процентом прогресса
 */
export const getProgressToNextLevel = (points: number, currentLevel: number) => {
    const current = LEVELS.find(l => l.level === currentLevel);
    const next = LEVELS.find(l => l.level === currentLevel + 1);

    if (!current || !next) return { current: 0, next: 0, progress: 0 };

    const currentPoints = points - current.minPoints;
    const pointsNeeded = next.minPoints - current.minPoints;
    const progress = Math.min((currentPoints / pointsNeeded) * 100, 100);

    return {
        current: currentPoints,
        next: pointsNeeded,
        progress
    };
};

/** 
 * Рассчитывает очки за выполнение задачи.
 * Учитывает приоритет, сложность и своевременность выполнения.
 */
export const calculateTaskPoints = (priority: Priority, effort: Effort, completedOnTime?: boolean): number => {
    let basePoints = PRIORITY_CONFIG[priority].points;

    if (effort === 'quick') basePoints += 5;
    if (completedOnTime) basePoints += 10;

    return basePoints;
};

/** 
 * Проверяет и обновляет прогресс достижений на основе статистики пользователя.
 * @returns Массив достижений с обновленным прогрессом
 */
export const checkAchievements = (stats: UserStats, achievements: Achievement[]): Achievement[] => {
    return achievements.map(achievement => {
        let progress = 0;

        switch (achievement.category) {
            case 'tasks':
                progress = stats.totalTasksCompleted;
                break;
            case 'streak':
                progress = stats.currentStreak;
                break;
            case 'time':
                progress = Math.floor(stats.totalFocusTime / 60);
                break;
            case 'special':
                progress = stats.perfectDays;
                break;
        }

        const isUnlocked = progress >= achievement.target;
        return {
            ...achievement,
            progress: Math.min(progress, achievement.target),
            unlockedAt: isUnlocked && !achievement.unlockedAt ? Date.now() : achievement.unlockedAt
        };
    });
};

/** Объект GamificationUtils для обратной совместимости */
export const GamificationUtils = {
    getLevelByPoints,
    getNextLevelPoints,
    getProgressToNextLevel,
    calculateTaskPoints,
    checkAchievements,
};
