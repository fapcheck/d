/**
 * Алгоритм расчёта "Zen Score" для определения приоритета задач.
 * Используется в FocusView для выбора лучшей задачи.
 */

import type { Client, Task } from '../types';

/**
 * Рассчитывает "Zen Score" для определения лучшей задачи.
 * Логика: Высокий приоритет > Быстрое выполнение > Приоритет клиента > Возраст задачи
 * 
 * @param task Задача для оценки
 * @param client Клиент/проект задачи
 * @returns Числовой скор (больше = выше приоритет)
 */
export const calculateTaskScore = (task: Task, client: Client): number => {
    let score = 0;

    // 1. Task Priority (Base Score)
    switch (task.priority) {
        case 'high': score += 1000; break;
        case 'normal': score += 500; break;
        case 'low': score += 100; break;
    }

    // 2. Effort Multiplier (Encourage "Quick Wins" to build momentum)
    if (task.priority === 'high' && task.effort === 'quick') score += 200;
    if (task.priority === 'normal' && task.effort === 'quick') score += 100;

    // 3. Client Importance
    switch (client.priority) {
        case 'high': score += 50; break;
        case 'normal': score += 20; break;
        case 'low': score += 0; break;
    }

    // 4. Age Factor (Older tasks gently bubble up)
    const ageInDays = (Date.now() - task.createdAt) / (1000 * 60 * 60 * 24);
    score += Math.min(ageInDays, 30); // Cap at 30 points

    return score;
};

/**
 * Находит лучшую задачу для фокуса среди всех клиентов.
 */
export const findBestFocusTask = (clients: Client[]): { task: Task; client: Client; score: number } | null => {
    const allCandidates: { task: Task; client: Client; score: number }[] = [];

    clients.forEach(client => {
        client.tasks.forEach(task => {
            if (!task.isDone) {
                allCandidates.push({
                    task,
                    client,
                    score: calculateTaskScore(task, client)
                });
            }
        });
    });

    if (allCandidates.length === 0) return null;

    // Sort by Score Descending
    allCandidates.sort((a, b) => b.score - a.score);
    return allCandidates[0];
};
