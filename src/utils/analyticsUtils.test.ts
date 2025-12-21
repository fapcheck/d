/**
 * Unit tests for analytics utilities.
 * Tests daily stats, project stats, and productivity health calculations.
 */

import { describe, it, expect } from 'vitest';
import {
    calculateDailyStats,
    calculateProjectStats,
    calculateProductivityHealth,
} from './analyticsUtils';
import type { Client, FocusSession, UserStats } from '../types';

// Helper to create mock client
const createMockClient = (overrides: Partial<Client> = {}): Client => ({
    id: Date.now(),
    name: 'Test Client',
    priority: 'normal',
    notes: [],
    accounts: [],
    tasks: [],
    createdAt: Date.now(),
    ...overrides,
});

// Helper to create mock focus session
const createMockSession = (overrides: Partial<FocusSession> = {}): FocusSession => ({
    id: Date.now(),
    clientId: 1,
    startTime: Date.now(),
    duration: 1800, // 30 minutes
    wasCompleted: true,
    ...overrides,
});

// Helper to create mock UserStats
const createMockStats = (overrides: Partial<UserStats> = {}): UserStats => ({
    totalTasksCompleted: 50,
    currentStreak: 5,
    maxStreak: 10,
    totalFocusTime: 7200,
    tasksThisWeek: 10,
    tasksThisMonth: 40,
    perfectDays: 3,
    averageTasksPerDay: 2,
    bestDay: { date: '2024-01-01', tasks: 5 },
    consistencyScore: 75,
    avgSessionDuration: 30,
    peakPerformanceHours: [9, 14],
    ...overrides,
});

describe('analyticsUtils', () => {
    // --- calculateDailyStats ---
    describe('calculateDailyStats', () => {
        it('returns empty array for empty date range', () => {
            const result = calculateDailyStats([], [], []);
            expect(result).toEqual([]);
        });

        it('returns stats with zero values for dates with no activity', () => {
            const result = calculateDailyStats([], [], ['2024-01-01']);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                date: '2024-01-01',
                tasksCompleted: 0,
                pointsEarned: 0,
                focusTime: 0,
                sessionsCount: 0,
            });
        });

        it('counts completed tasks for specific date', () => {
            const date = '2024-01-15';
            const taskCompletedAt = new Date(date + 'T12:00:00').getTime();

            const client = createMockClient({
                tasks: [{
                    id: 1,
                    title: 'Test Task',
                    isDone: true,
                    completedAt: taskCompletedAt,
                    pointsEarned: 20,
                    priority: 'normal',
                    effort: 'medium',
                    createdAt: Date.now(),
                    comments: [],
                }],
            });

            const result = calculateDailyStats([client], [], [date]);
            expect(result[0].tasksCompleted).toBe(1);
            expect(result[0].pointsEarned).toBe(20);
        });

        it('calculates focus time in minutes', () => {
            const date = '2024-01-15';
            const session = createMockSession({
                startTime: new Date(date + 'T10:00:00').getTime(),
                duration: 3600, // 60 minutes in seconds
            });

            const result = calculateDailyStats([], [session], [date]);
            expect(result[0].focusTime).toBe(60); // 60 minutes
            expect(result[0].sessionsCount).toBe(1);
        });

        it('does not count tasks from other dates', () => {
            const targetDate = '2024-01-15';
            const otherDate = new Date('2024-01-16T12:00:00').getTime();

            const client = createMockClient({
                tasks: [{
                    id: 1,
                    title: 'Other Day Task',
                    isDone: true,
                    completedAt: otherDate,
                    priority: 'normal',
                    effort: 'medium',
                    createdAt: Date.now(),
                    comments: [],
                }],
            });

            const result = calculateDailyStats([client], [], [targetDate]);
            expect(result[0].tasksCompleted).toBe(0);
        });
    });

    // --- calculateProjectStats ---
    describe('calculateProjectStats', () => {
        it('returns empty array for no clients', () => {
            const result = calculateProjectStats([]);
            expect(result).toEqual([]);
        });

        it('returns stats for each client', () => {
            const clients = [
                createMockClient({ id: 1, name: 'Project A' }),
                createMockClient({ id: 2, name: 'Project B' }),
            ];

            const result = calculateProjectStats(clients);
            expect(result).toHaveLength(2);
            expect(result[0].clientName).toBe('Project A');
            expect(result[1].clientName).toBe('Project B');
        });

        it('calculates total and completed task counts', () => {
            const client = createMockClient({
                tasks: [
                    { id: 1, title: 'Done', isDone: true, priority: 'normal', effort: 'medium', createdAt: Date.now(), comments: [] },
                    { id: 2, title: 'Done 2', isDone: true, priority: 'normal', effort: 'medium', createdAt: Date.now(), comments: [] },
                    { id: 3, title: 'Pending', isDone: false, priority: 'normal', effort: 'medium', createdAt: Date.now(), comments: [] },
                ],
            });

            const result = calculateProjectStats([client]);
            expect(result[0].totalTasks).toBe(3);
            expect(result[0].completedTasks).toBe(2);
        });

        it('calculates priority distribution correctly', () => {
            const client = createMockClient({
                tasks: [
                    { id: 1, title: 'High', isDone: false, priority: 'high', effort: 'medium', createdAt: Date.now(), comments: [] },
                    { id: 2, title: 'Normal', isDone: false, priority: 'normal', effort: 'medium', createdAt: Date.now(), comments: [] },
                    { id: 3, title: 'Normal 2', isDone: false, priority: 'normal', effort: 'medium', createdAt: Date.now(), comments: [] },
                    { id: 4, title: 'Low', isDone: false, priority: 'low', effort: 'medium', createdAt: Date.now(), comments: [] },
                ],
            });

            const result = calculateProjectStats([client]);
            const distribution = result[0].priorityDistribution;

            expect(distribution.find(d => d.priority === 'high')?.count).toBe(1);
            expect(distribution.find(d => d.priority === 'normal')?.count).toBe(2);
            expect(distribution.find(d => d.priority === 'low')?.count).toBe(1);
        });
    });

    // --- calculateProductivityHealth ---
    describe('calculateProductivityHealth', () => {
        it('returns health object with required fields', () => {
            const result = calculateProductivityHealth([], [], createMockStats());

            expect(result).toHaveProperty('score');
            expect(result).toHaveProperty('level');
            expect(result).toHaveProperty('factors');
            expect(result).toHaveProperty('recommendations');
            expect(result).toHaveProperty('trends');
        });

        it('calculates excellent level for high scores', () => {
            const stats = createMockStats({
                consistencyScore: 95,
                totalFocusTime: 36000, // 600 minutes = 10 hours
            });

            const result = calculateProductivityHealth([], [], stats);
            expect(result.level).toBe('excellent');
            expect(result.score).toBeGreaterThanOrEqual(80);
        });

        it('calculates good level for moderate scores', () => {
            const stats = createMockStats({
                consistencyScore: 70,
                totalFocusTime: 18000, // 300 minutes = 5 hours
            });

            const result = calculateProductivityHealth([], [], stats);
            expect(['excellent', 'good']).toContain(result.level);
        });

        it('adds recommendation when consistency is low', () => {
            const stats = createMockStats({
                consistencyScore: 30,
                totalFocusTime: 600,
            });

            const result = calculateProductivityHealth([], [], stats);
            expect(result.recommendations.length).toBeGreaterThan(0);
            expect(result.recommendations.some(r => r.id === 'improve_consistency')).toBe(true);
        });

        it('includes consistency and focus factors', () => {
            const result = calculateProductivityHealth([], [], createMockStats());

            const factorNames = result.factors.map(f => f.name);
            expect(factorNames).toContain('Консистентность');
            expect(factorNames).toContain('Глубокий фокус');
        });

        it('includes trends with prediction', () => {
            const result = calculateProductivityHealth([], [], createMockStats());

            expect(result.trends.direction).toBeDefined();
            expect(result.trends.prediction).toBeDefined();
            expect(result.trends.prediction.confidence).toBeGreaterThan(0);
        });
    });
});
