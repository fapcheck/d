/**
 * Хук для запуска конфетти эффектов при достижениях и завершении задач.
 */

import { useCallback } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiOptions {
    /** Интенсивность эффекта */
    intensity?: 'light' | 'medium' | 'celebration';
}

/**
 * Хук для запуска конфетти эффектов.
 * Использует canvas-confetti для красивых анимаций.
 */
export function useConfetti() {

    /**
     * Базовый конфетти эффект при завершении задачи.
     */
    const fireTaskComplete = useCallback((options?: ConfettiOptions) => {
        const intensity = options?.intensity ?? 'light';

        const configs = {
            light: {
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 },
                colors: ['#10b981', '#34d399', '#6ee7b7'],
                gravity: 1.2,
                scalar: 0.8,
            },
            medium: {
                particleCount: 80,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#10b981', '#3b82f6', '#8b5cf6'],
                gravity: 1,
                scalar: 1,
            },
            celebration: {
                particleCount: 150,
                spread: 100,
                origin: { y: 0.5 },
                colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'],
                gravity: 0.8,
                scalar: 1.2,
            }
        };

        confetti(configs[intensity]);
    }, []);

    /**
     * Эффект для получения достижения - более впечатляющий.
     */
    const fireAchievement = useCallback(() => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;

        const colors = ['#fbbf24', '#f59e0b', '#d97706', '#10b981', '#8b5cf6'];

        const frame = () => {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: colors,
                shapes: ['star', 'circle'],
                scalar: 1.2,
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: colors,
                shapes: ['star', 'circle'],
                scalar: 1.2,
            });

            if (Date.now() < animationEnd) {
                requestAnimationFrame(frame);
            }
        };

        frame();

        // Финальный взрыв
        setTimeout(() => {
            confetti({
                particleCount: 200,
                spread: 120,
                origin: { y: 0.4 },
                colors: colors,
                shapes: ['star', 'circle', 'square'],
                gravity: 0.6,
                scalar: 1.5,
                drift: 0,
            });
        }, duration - 500);
    }, []);

    /**
     * Эффект для повышения уровня.
     */
    const fireLevelUp = useCallback(() => {
        const colors = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#fbbf24'];

        // Сначала боковые лучи
        confetti({
            particleCount: 100,
            angle: 90,
            spread: 45,
            origin: { x: 0.5, y: 1 },
            colors: colors,
            shapes: ['star'],
            scalar: 2,
            gravity: 0.4,
            drift: 0,
            ticks: 300,
        });

        // Затем взрыв сверху
        setTimeout(() => {
            confetti({
                particleCount: 150,
                spread: 360,
                origin: { x: 0.5, y: 0.3 },
                colors: colors,
                shapes: ['circle', 'star'],
                scalar: 1.5,
                gravity: 0.8,
            });
        }, 300);
    }, []);

    return {
        fireTaskComplete,
        fireAchievement,
        fireLevelUp,
    };
}
