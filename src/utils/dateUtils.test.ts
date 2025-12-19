/**
 * Тесты для утилит работы с датами.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    isToday,
    isTomorrow,
    isOverdue,
    isUpcoming,
    getDaysUntil,
    formatDueDate,
    isSameDay,
    startOfDay,
    formatDate,
    getDateRange
} from '../utils/dateUtils';

describe('DateUtils', () => {
    beforeEach(() => {
        // Фиксируем дату для предсказуемых тестов
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-01-15T12:00:00'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('isToday', () => {
        it('возвращает true для сегодняшней даты', () => {
            const today = new Date('2025-01-15T08:00:00').getTime();
            expect(isToday(today)).toBe(true);
        });

        it('возвращает false для вчерашней даты', () => {
            const yesterday = new Date('2025-01-14T08:00:00').getTime();
            expect(isToday(yesterday)).toBe(false);
        });

        it('возвращает false для undefined', () => {
            expect(isToday(undefined)).toBe(false);
        });
    });

    describe('isTomorrow', () => {
        it('возвращает true для завтрашней даты', () => {
            const tomorrow = new Date('2025-01-16T08:00:00').getTime();
            expect(isTomorrow(tomorrow)).toBe(true);
        });

        it('возвращает false для сегодняшней даты', () => {
            const today = new Date('2025-01-15T08:00:00').getTime();
            expect(isTomorrow(today)).toBe(false);
        });
    });

    describe('isOverdue', () => {
        it('возвращает true для прошедшей даты', () => {
            const past = new Date('2025-01-10T08:00:00').getTime();
            expect(isOverdue(past)).toBe(true);
        });

        it('возвращает false для будущей даты', () => {
            const future = new Date('2025-01-20T08:00:00').getTime();
            expect(isOverdue(future)).toBe(false);
        });
    });

    describe('isUpcoming', () => {
        it('возвращает true для даты в пределах 7 дней', () => {
            const upcoming = new Date('2025-01-18T08:00:00').getTime();
            expect(isUpcoming(upcoming)).toBe(true);
        });

        it('возвращает false для даты через 10 дней', () => {
            const farFuture = new Date('2025-01-25T08:00:00').getTime();
            expect(isUpcoming(farFuture)).toBe(false);
        });

        it('возвращает false для прошедшей даты', () => {
            const past = new Date('2025-01-10T08:00:00').getTime();
            expect(isUpcoming(past)).toBe(false);
        });
    });

    describe('getDaysUntil', () => {
        it('возвращает количество дней до будущей даты', () => {
            const future = new Date('2025-01-20T12:00:00').getTime();
            expect(getDaysUntil(future)).toBe(5);
        });

        it('возвращает отрицательное число для прошедшей даты', () => {
            const past = new Date('2025-01-10T12:00:00').getTime();
            expect(getDaysUntil(past)).toBe(-5);
        });

        it('возвращает null для undefined', () => {
            expect(getDaysUntil(undefined)).toBe(null);
        });
    });

    describe('formatDueDate', () => {
        it('возвращает "Сегодня" для сегодняшней даты', () => {
            const today = new Date('2025-01-15T20:00:00').getTime();
            expect(formatDueDate(today)).toBe('Сегодня');
        });

        it('возвращает "Завтра" для завтрашней даты', () => {
            const tomorrow = new Date('2025-01-16T08:00:00').getTime();
            expect(formatDueDate(tomorrow)).toBe('Завтра');
        });

        it('возвращает "Через N дн." для ближайших дней', () => {
            const inFiveDays = new Date('2025-01-20T08:00:00').getTime();
            expect(formatDueDate(inFiveDays)).toBe('Через 5 дн.');
        });
    });

    describe('isSameDay', () => {
        it('возвращает true для одинаковых дат', () => {
            const date1 = new Date('2025-01-15T08:00:00');
            const date2 = new Date('2025-01-15T20:00:00');
            expect(isSameDay(date1, date2)).toBe(true);
        });

        it('возвращает false для разных дат', () => {
            const date1 = new Date('2025-01-15T08:00:00');
            const date2 = new Date('2025-01-16T08:00:00');
            expect(isSameDay(date1, date2)).toBe(false);
        });
    });

    describe('startOfDay', () => {
        it('возвращает дату с временем 00:00:00', () => {
            const date = new Date('2025-01-15T14:30:00');
            const result = startOfDay(date);
            expect(result.getHours()).toBe(0);
            expect(result.getMinutes()).toBe(0);
            expect(result.getSeconds()).toBe(0);
        });
    });

    describe('formatDate', () => {
        it('форматирует дату в YYYY-MM-DD', () => {
            const timestamp = new Date('2025-01-15T12:00:00Z').getTime();
            expect(formatDate(timestamp)).toBe('2025-01-15');
        });
    });

    describe('getDateRange', () => {
        it('возвращает массив дат указанной длины', () => {
            const range = getDateRange(7);
            expect(range).toHaveLength(7);
            expect(range[6]).toBe('2025-01-15');
            expect(range[0]).toBe('2025-01-09');
        });
    });
});
