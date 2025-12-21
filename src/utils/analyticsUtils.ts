import { Client, FocusSession, UserStats, UserProgress, DailyStats, ProjectStats, ProductivityHealth, HealthFactor, Recommendation, HealthTrend, BurndownPoint, PriorityDistribution } from '../types';
import { DateUtils } from './dateUtils';
import { GamificationUtils } from './gamificationUtils';

export const calculateDailyStats = (clients: Client[], focusSessions: FocusSession[], dateRange: string[]): DailyStats[] => {
    return dateRange.map(date => {
        const dayStart = new Date(date + 'T00:00:00').getTime();
        const dayEnd = new Date(date + 'T23:59:59').getTime();

        let tasksCompleted = 0;
        let pointsEarned = 0;

        clients.forEach(client => {
            client.tasks.forEach(task => {
                if (task.isDone && task.completedAt && task.completedAt >= dayStart && task.completedAt <= dayEnd) {
                    tasksCompleted++;
                    pointsEarned += task.pointsEarned || 0;
                }
            });
        });

        const sessionsForDay = focusSessions.filter(session =>
            session.startTime >= dayStart && session.startTime <= dayEnd
        );

        const focusTime = sessionsForDay.reduce((acc, session) => acc + session.duration, 0) / 60; // в минутах

        return {
            date,
            tasksCompleted,
            pointsEarned,
            focusTime,
            sessionsCount: sessionsForDay.length
        };
    });
};

export const calculateProjectStats = (clients: Client[]): ProjectStats[] => {
    return clients.map(client => {
        const tasks = client.tasks;
        const completedTasks = tasks.filter(t => t.isDone);
        const totalTasks = tasks.length;
        const totalCompleted = completedTasks.length;

        const burndownData: BurndownPoint[] = [];
        const completedDates = completedTasks
            .filter(t => t.completedAt)
            .map(t => DateUtils.formatDate(t.completedAt!))
            .sort();

        const allDates = Array.from(new Set([
            ...DateUtils.getDateRange(30),
            ...completedDates
        ])).sort();

        let remainingTasks = totalTasks;
        // Estimate initial tasks 30 days ago (lazy approximation)
        const initialTasks = totalTasks;

        // Better burndown logic: count backwards or track snapshots?
        // For now, let's just show current burn based on completion dates
        const tasksByDate = completedTasks.reduce((acc, task) => {
            if (task.completedAt) {
                const d = DateUtils.formatDate(task.completedAt);
                acc[d] = (acc[d] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        remainingTasks = totalTasks - totalCompleted;

        const priorityDistribution: PriorityDistribution[] = ['high', 'normal', 'low'].map(p => {
            const count = tasks.filter(t => t.priority === p).length;
            const tasksOfPriority = completedTasks.filter(t => t.priority === p);
            const avgTimeSpent = tasksOfPriority.reduce((acc, t) => acc + (t.timeSpent || 0), 0) / (tasksOfPriority.length || 1);

            return {
                priority: p as 'high' | 'normal' | 'low',
                count,
                percentage: totalTasks > 0 ? (count / totalTasks) * 100 : 0,
                avgTimeSpent
            };
        });

        const avgTaskSpeed = completedTasks.length > 0
            ? completedTasks.reduce((acc, task) => {
                if (task.completedAt) {
                    return acc + (task.completedAt - task.createdAt);
                }
                return acc;
            }, 0) / completedTasks.length / (1000 * 60 * 60)
            : 0;

        return {
            clientId: client.id,
            clientName: client.name,
            totalTasks,
            completedTasks: totalCompleted,
            burndownData,
            priorityDistribution,
            avgTaskSpeed
        };
    });
};

export const calculateProductivityHealth = (clients: Client[], focusSessions: FocusSession[], stats: UserStats): ProductivityHealth => {
    const factors: HealthFactor[] = [];
    const recommendations: Recommendation[] = [];

    // Фактор 1: Консистентность
    const consistencyScore = Math.min(100, stats.consistencyScore);
    factors.push({
        name: 'Консистентность',
        score: consistencyScore,
        weight: 0.3,
        status: consistencyScore >= 70 ? 'positive' : consistencyScore >= 40 ? 'neutral' : 'negative',
        description: `${Math.round(consistencyScore)}% выполнения планов`
    });

    // Фактор 2: Фокус
    const focusScore = Math.min(100, (stats.totalFocusTime / 60) / 10 * 100); // Цель: 10 часов в неделю (условно)
    factors.push({
        name: 'Глубокий фокус',
        score: focusScore,
        weight: 0.4,
        status: focusScore >= 80 ? 'positive' : focusScore >= 50 ? 'neutral' : 'negative',
        description: `${Math.round(stats.totalFocusTime / 60)} часов фокуса`
    });

    // Расчет общего балла
    const totalScore = factors.reduce((acc, f) => acc + (f.score * f.weight), 0) / factors.reduce((acc, f) => acc + f.weight, 0);

    let level: ProductivityHealth['level'] = 'warning';
    if (totalScore >= 80) level = 'excellent';
    else if (totalScore >= 60) level = 'good';
    else if (totalScore < 40) level = 'critical';

    // Рекомендации
    if (consistencyScore < 50) {
        recommendations.push({
            id: 'improve_consistency',
            type: 'schedule',
            priority: 'high',
            title: 'Улучшите постоянство',
            description: 'Старайтесь выполнять хотя бы 1 задачу каждый день',
            action: 'Запланируйте задачу на завтра'
        });
    }

    const trends: HealthTrend = {
        direction: stats.consistencyScore > (stats.consistencyScore * 0.9) ? 'improving' : 'stable',
        change: stats.consistencyScore, // dummy change
        period: 'week',
        prediction: {
            nextWeek: Math.min(100, totalScore + (Math.random() * 20 - 10)),
            confidence: 0.7
        }
    };

    return {
        score: Math.round(totalScore),
        level,
        factors,
        recommendations,
        trends
    };
};

export const AnalyticsUtils = {
    calculateDailyStats,
    calculateProjectStats,
    calculateProductivityHealth
};
