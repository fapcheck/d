/**
 * Hook for managing gamification: points, levels, achievements, stats.
 * Extracted from useZenData for better modularity.
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ACHIEVEMENTS } from '../constants';
import { GamificationUtils, DateUtils } from '../utils';
import type { Client, FocusSession, UserProgress, UserStats, Achievement } from '../types';

// --- Stats Calculation ---
export const calculateUserStats = (clients: Client[], focusSessions: FocusSession[]): UserStats => {
    let totalTasksCompleted = 0;
    const tasksByDate: { [date: string]: number } = {};
    let perfectDays = 0;
    const now = new Date();
    const today = DateUtils.startOfDay(now);

    clients.forEach(client => {
        client.tasks.forEach(task => {
            if (task.isDone && task.completedAt) {
                totalTasksCompleted++;
                const dateKey = new Date(task.completedAt).toISOString().split('T')[0];
                tasksByDate[dateKey] = (tasksByDate[dateKey] || 0) + 1;

                if (!task.dueDate || task.completedAt <= task.dueDate) {
                    const perfectKey = `${dateKey}_perfect`;
                    tasksByDate[perfectKey] = (tasksByDate[perfectKey] || 0) + 1;
                }
            }
        });
    });

    let currentStreak = 0;
    const dates = Object.keys(tasksByDate).filter(k => !k.endsWith('_perfect')).sort().reverse();

    for (let i = 0; i < dates.length; i++) {
        const d = new Date(dates[i]);
        const expected = new Date(today);
        expected.setDate(expected.getDate() - i);
        if (DateUtils.isSameDay(d, expected) || (i === 0 && DateUtils.isSameDay(d, new Date(today.getTime() - 86400000)))) {
            currentStreak++;
        } else {
            break;
        }
    }

    const uniqueDates = Object.keys(tasksByDate).filter(k => !k.endsWith('_perfect'));
    let tasksThisWeek = 0;
    let tasksThisMonth = 0;
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const monthAgo = new Date(now.getTime() - 30 * 86400000);

    uniqueDates.forEach(dateStr => {
        const d = new Date(dateStr);
        const count = tasksByDate[dateStr];
        if (d >= weekAgo) tasksThisWeek += count;
        if (d >= monthAgo) tasksThisMonth += count;
        const perfectCount = tasksByDate[`${dateStr}_perfect`] || 0;
        if (count > 0 && count === perfectCount) perfectDays++;
    });

    const totalFocusTime = focusSessions.reduce((acc, s) => acc + s.duration, 0) / 60;
    const completedSessions = focusSessions.filter(s => s.wasCompleted);
    const avgSessionDuration = completedSessions.length > 0
        ? completedSessions.reduce((acc, s) => acc + s.duration, 0) / completedSessions.length / 60
        : 0;

    const hourPerformance = new Array(24).fill(0);
    completedSessions.forEach(s => hourPerformance[new Date(s.startTime).getHours()]++);
    const peakPerformanceHours = hourPerformance
        .map((c, h) => ({ h, c }))
        .sort((a, b) => b.c - a.c)
        .slice(0, 3)
        .map(x => x.h);

    return {
        totalTasksCompleted,
        currentStreak,
        maxStreak: Math.max(currentStreak, 0),
        totalFocusTime,
        tasksThisWeek,
        tasksThisMonth,
        perfectDays,
        averageTasksPerDay: uniqueDates.length ? Math.round((totalTasksCompleted / uniqueDates.length) * 10) / 10 : 0,
        bestDay: { date: '', tasks: 0 },
        consistencyScore: uniqueDates.length ? Math.min(100, Math.round((currentStreak / 7) * 100)) : 0,
        avgSessionDuration,
        peakPerformanceHours
    };
};

interface UseGamificationReturn {
    userProgress: UserProgress;
    newAchievement: Achievement | null;
    dismissAchievement: () => void;
}

export function useGamification(
    clients: Client[],
    focusSessions: FocusSession[],
    isLoaded: boolean,
    onAchievementUnlocked?: (achievement: Achievement) => void
): UseGamificationReturn {
    const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
    const prevUnlockedIds = useRef<Set<string>>(new Set());

    // Main computation
    const userProgress = useMemo((): UserProgress => {
        if (!isLoaded) {
            return {
                totalPoints: 0,
                level: 1,
                currentLevelPoints: 0,
                nextLevelPoints: 100,
                achievements: ACHIEVEMENTS,
                focusSessions: [],
                stats: calculateUserStats([], []),
                history: [],
                timePredictions: [],
                productivityHealth: {
                    score: 0,
                    level: 'good',
                    factors: [],
                    recommendations: [],
                    trends: { direction: 'stable', change: 0, period: 'week', prediction: { nextWeek: 0, confidence: 0 } }
                }
            };
        }

        const stats = calculateUserStats(clients, focusSessions);
        const derivedAchievements = GamificationUtils.checkAchievements(stats, ACHIEVEMENTS);
        const totalPoints = clients.reduce((acc, c) =>
            acc + c.tasks.reduce((sum, t) => sum + (t.isDone ? (t.pointsEarned || 0) : 0), 0), 0
        );
        const levelInfo = GamificationUtils.getLevelByPoints(totalPoints);
        const progress = GamificationUtils.getProgressToNextLevel(totalPoints, levelInfo.level);

        return {
            totalPoints,
            level: levelInfo.level,
            currentLevelPoints: progress.current,
            nextLevelPoints: progress.next,
            achievements: derivedAchievements,
            stats,
            focusSessions,
            history: [],
            timePredictions: [],
            productivityHealth: {
                score: stats.consistencyScore,
                level: stats.consistencyScore > 80 ? 'excellent' : 'good',
                factors: [],
                recommendations: [],
                trends: { direction: 'stable', change: 0, period: 'week', prediction: { nextWeek: 0, confidence: 0 } }
            }
        };
    }, [clients, focusSessions, isLoaded]);

    // Achievement notifications
    useEffect(() => {
        if (!isLoaded) return;
        if (prevUnlockedIds.current.size === 0) {
            userProgress.achievements.forEach(a => {
                if (a.unlockedAt) prevUnlockedIds.current.add(a.id);
            });
            return;
        }
        const newUnlock = userProgress.achievements.find(a =>
            a.unlockedAt && !prevUnlockedIds.current.has(a.id)
        );
        if (newUnlock) {
            prevUnlockedIds.current.add(newUnlock.id);
            setNewAchievement(newUnlock);
            onAchievementUnlocked?.(newUnlock);
        }
    }, [userProgress.achievements, isLoaded, onAchievementUnlocked]);

    const dismissAchievement = useCallback(() => setNewAchievement(null), []);

    return {
        userProgress,
        newAchievement,
        dismissAchievement,
    };
}
