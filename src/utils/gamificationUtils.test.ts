/**
 * Unit tests for gamification utilities.
 * Tests level calculation, point scoring, and achievement checking.
 */

import { describe, it, expect } from 'vitest';
import {
    getLevelByPoints,
    getNextLevelPoints,
    getProgressToNextLevel,
    calculateTaskPoints,
    checkAchievements,
} from './gamificationUtils';
import type { Achievement, UserStats } from '../types';

describe('gamificationUtils', () => {
    // --- getLevelByPoints ---
    describe('getLevelByPoints', () => {
        it('returns level 1 for 0 points', () => {
            const level = getLevelByPoints(0);
            expect(level.level).toBe(1);
        });

        it('returns level 2 for 100+ points', () => {
            const level = getLevelByPoints(100);
            expect(level.level).toBe(2);
        });

        it('returns highest reachable level for large points', () => {
            const level = getLevelByPoints(10000);
            expect(level.level).toBeGreaterThanOrEqual(5);
        });

        it('stays at current level just before threshold', () => {
            const level = getLevelByPoints(99);
            expect(level.level).toBe(1);
        });
    });

    // --- getNextLevelPoints ---
    describe('getNextLevelPoints', () => {
        it('returns points needed for level 2 from level 1', () => {
            const points = getNextLevelPoints(1);
            expect(points).toBe(100); // Level 2 starts at 100
        });

        it('returns points needed for level 3 from level 2', () => {
            const points = getNextLevelPoints(2);
            expect(points).toBe(300); // Level 3 starts at 300
        });

        it('returns current level points for max level', () => {
            const points = getNextLevelPoints(10); // Max level
            expect(points).toBeGreaterThanOrEqual(0);
        });
    });

    // --- getProgressToNextLevel ---
    describe('getProgressToNextLevel', () => {
        it('returns 0% progress at level start', () => {
            const progress = getProgressToNextLevel(0, 1);
            expect(progress.progress).toBe(0);
            expect(progress.current).toBe(0);
        });

        it('returns 50% progress halfway through level', () => {
            // Level 1: 0-99, Level 2: 100-249 (100 points range)
            const progress = getProgressToNextLevel(50, 1);
            expect(progress.progress).toBe(50);
        });

        it('returns 100% progress when at next level threshold', () => {
            const progress = getProgressToNextLevel(100, 1);
            expect(progress.progress).toBe(100);
        });

        it('handles invalid level gracefully', () => {
            const progress = getProgressToNextLevel(100, 999);
            expect(progress.progress).toBe(0);
        });
    });

    // --- calculateTaskPoints ---
    describe('calculateTaskPoints', () => {
        it('awards base points for normal priority task', () => {
            const points = calculateTaskPoints('normal', 'medium');
            expect(points).toBe(20); // Normal priority base
        });

        it('awards extra points for high priority task', () => {
            const points = calculateTaskPoints('high', 'medium');
            expect(points).toBe(30); // High priority base
        });

        it('awards extra points for quick effort', () => {
            const points = calculateTaskPoints('normal', 'quick');
            expect(points).toBe(25); // 20 base + 5 quick bonus
        });

        it('awards extra points for on-time completion', () => {
            const points = calculateTaskPoints('normal', 'medium', true);
            expect(points).toBe(30); // 20 base + 10 on-time bonus
        });

        it('stacks all bonuses correctly', () => {
            const points = calculateTaskPoints('high', 'quick', true);
            expect(points).toBe(45); // 30 base + 5 quick + 10 on-time
        });
    });

    // --- checkAchievements ---
    describe('checkAchievements', () => {
        // Using Partial<UserStats> cast for minimal mock data
        const mockStats = {
            totalTasksCompleted: 50,
            currentStreak: 5,
            totalFocusTime: 7200, // 2 hours = 120 minutes
            perfectDays: 3,
            maxStreak: 10,
            tasksThisWeek: 5,
            tasksThisMonth: 20,
            averageTasksPerDay: 2,
            bestDay: { date: '2024-01-01', tasks: 5 },
            consistencyScore: 80,
            avgSessionDuration: 30,
            peakPerformanceHours: [9, 14],
        } as UserStats;

        // Using unknown cast for mock achievements (icon type is complex LucideIcon)
        const mockAchievements = [
            { id: 'task_1', name: 'Task Master', description: '', category: 'tasks', target: 100, progress: 0, icon: {} },
            { id: 'streak_1', name: 'Streak Builder', description: '', category: 'streak', target: 7, progress: 0, icon: {} },
            { id: 'time_1', name: 'Focus Expert', description: '', category: 'time', target: 60, progress: 0, icon: {} },
            { id: 'special_1', name: 'Perfect', description: '', category: 'special', target: 5, progress: 0, icon: {} },
        ] as unknown as Achievement[];

        it('updates task achievement progress correctly', () => {
            const updated = checkAchievements(mockStats, mockAchievements);
            const taskAchievement = updated.find(a => a.category === 'tasks');
            expect(taskAchievement?.progress).toBe(50);
        });

        it('updates streak achievement progress correctly', () => {
            const updated = checkAchievements(mockStats, mockAchievements);
            const streakAchievement = updated.find(a => a.category === 'streak');
            expect(streakAchievement?.progress).toBe(5);
        });

        it('converts focus time to minutes for time achievements', () => {
            const updated = checkAchievements(mockStats, mockAchievements);
            const timeAchievement = updated.find(a => a.category === 'time');
            expect(timeAchievement?.progress).toBe(60); // Capped at target
        });

        it('unlocks achievement when target is reached', () => {
            const statsWithUnlock: UserStats = {
                ...mockStats,
                totalFocusTime: 3600, // 60 minutes exactly
            };
            const updated = checkAchievements(statsWithUnlock, mockAchievements);
            const timeAchievement = updated.find(a => a.category === 'time');
            expect(timeAchievement?.unlockedAt).toBeDefined();
        });

        it('caps progress at target value', () => {
            const statsOverTarget: UserStats = {
                ...mockStats,
                totalTasksCompleted: 200,
            };
            const achievements = [
                { id: 'test_1', name: 'Test', description: '', category: 'tasks', target: 50, progress: 0, icon: {} },
            ] as unknown as Achievement[];
            const updated = checkAchievements(statsOverTarget, achievements);
            expect(updated[0].progress).toBe(50); // Capped at target
        });

        it('preserves existing unlockedAt timestamp', () => {
            const existingUnlock = Date.now() - 1000;
            const achievements = [
                { id: 'test_1', name: 'Test', description: '', category: 'tasks', target: 50, progress: 50, unlockedAt: existingUnlock, icon: {} },
            ] as unknown as Achievement[];
            const updated = checkAchievements(mockStats, achievements);
            expect(updated[0].unlockedAt).toBe(existingUnlock);
        });
    });
});
