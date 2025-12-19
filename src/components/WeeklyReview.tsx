/**
 * Weekly Review Dashboard - Shows weekly productivity comparison.
 * Compares current week with previous week and provides recommendations.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp, TrendingDown, Minus, Trophy, Flame, Clock,
    Target, Calendar, Star, ArrowRight, CheckCircle2
} from 'lucide-react';
import type { Client, FocusSession } from '../types';

export interface WeeklyReviewProps {
    clients: Client[];
    focusSessions: FocusSession[];
    className?: string;
}

interface WeekStats {
    tasksCompleted: number;
    pointsEarned: number;
    focusMinutes: number;
    highPriorityDone: number;
    projectsWorkedOn: number;
}

const calculateWeekStats = (
    clients: Client[],
    focusSessions: FocusSession[],
    weekStart: Date
): WeekStats => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    let tasksCompleted = 0;
    let pointsEarned = 0;
    let highPriorityDone = 0;
    const projectsSet = new Set<number>();

    clients.forEach(client => {
        client.tasks.forEach(task => {
            if (task.isDone && task.completedAt) {
                const completedDate = new Date(task.completedAt);
                if (completedDate >= weekStart && completedDate < weekEnd) {
                    tasksCompleted++;
                    pointsEarned += task.pointsEarned || 0;
                    if (task.priority === 'high') highPriorityDone++;
                    projectsSet.add(client.id);
                }
            }
        });
    });

    const focusMinutes = focusSessions
        .filter(s => {
            const sessionDate = new Date(s.startTime);
            return sessionDate >= weekStart && sessionDate < weekEnd;
        })
        .reduce((sum, s) => sum + Math.round(s.duration / 60), 0);

    return {
        tasksCompleted,
        pointsEarned,
        focusMinutes,
        highPriorityDone,
        projectsWorkedOn: projectsSet.size,
    };
};

const TrendIndicator: React.FC<{ current: number; previous: number; suffix?: string }> = ({
    current, previous, suffix = ''
}) => {
    const diff = current - previous;
    const percentage = previous > 0 ? Math.round((diff / previous) * 100) : current > 0 ? 100 : 0;

    if (diff === 0) {
        return <span className="text-secondary flex items-center gap-1"><Minus size={14} /> no change</span>;
    }

    const isPositive = diff > 0;
    return (
        <span className={`flex items-center gap-1 ${isPositive ? 'text-success' : 'text-error'}`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {isPositive ? '+' : ''}{diff}{suffix} ({isPositive ? '+' : ''}{percentage}%)
        </span>
    );
};

export const WeeklyReview = ({
    clients,
    focusSessions,
    className = ''
}: WeeklyReviewProps) => {
    const { thisWeek, lastWeek, weekStartDate } = useMemo(() => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

        const thisWeekStart = new Date(now);
        thisWeekStart.setDate(now.getDate() + mondayOffset);
        thisWeekStart.setHours(0, 0, 0, 0);

        const lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);

        return {
            thisWeek: calculateWeekStats(clients, focusSessions, thisWeekStart),
            lastWeek: calculateWeekStats(clients, focusSessions, lastWeekStart),
            weekStartDate: thisWeekStart,
        };
    }, [clients, focusSessions]);

    const overallTrend = useMemo(() => {
        const thisScore = thisWeek.tasksCompleted + thisWeek.highPriorityDone * 2;
        const lastScore = lastWeek.tasksCompleted + lastWeek.highPriorityDone * 2;

        if (thisScore > lastScore * 1.2) return 'excellent';
        if (thisScore >= lastScore) return 'good';
        return 'needs-attention';
    }, [thisWeek, lastWeek]);

    const trendEmoji = overallTrend === 'excellent' ? '🔥' : overallTrend === 'good' ? '✨' : '💪';
    const trendMessage = overallTrend === 'excellent'
        ? 'Excellent Week!'
        : overallTrend === 'good'
            ? 'Steady Progress'
            : 'Room for Improvement';

    return (
        <div className={`space-y-8 ${className}`}>
            {/* Header */}
            <div className="text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl glass border border-white/10 mb-4"
                >
                    <Calendar className="text-primary" size={24} />
                    <span className="text-xl font-bold text-white">
                        Week of {weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">
                    {trendEmoji} {trendMessage}
                </h2>
                <p className="text-secondary">Your weekly productivity overview</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-6 rounded-2xl border border-white/5"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center">
                            <CheckCircle2 className="text-success" size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-secondary">Tasks</h3>
                            <p className="text-3xl font-bold text-white">{thisWeek.tasksCompleted}</p>
                        </div>
                    </div>
                    <TrendIndicator current={thisWeek.tasksCompleted} previous={lastWeek.tasksCompleted} />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass p-6 rounded-2xl border border-white/5"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-yellow-400/20 rounded-xl flex items-center justify-center">
                            <Star className="text-yellow-400" size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-secondary">Points</h3>
                            <p className="text-3xl font-bold text-white">{thisWeek.pointsEarned}</p>
                        </div>
                    </div>
                    <TrendIndicator current={thisWeek.pointsEarned} previous={lastWeek.pointsEarned} />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass p-6 rounded-2xl border border-white/5"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-red-400/20 rounded-xl flex items-center justify-center">
                            <Flame className="text-red-400" size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-secondary">High Priority</h3>
                            <p className="text-3xl font-bold text-white">{thisWeek.highPriorityDone}</p>
                        </div>
                    </div>
                    <TrendIndicator current={thisWeek.highPriorityDone} previous={lastWeek.highPriorityDone} />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass p-6 rounded-2xl border border-white/5"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-purple-400/20 rounded-xl flex items-center justify-center">
                            <Clock className="text-purple-400" size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-secondary">Focus Time</h3>
                            <p className="text-3xl font-bold text-white">{thisWeek.focusMinutes} min</p>
                        </div>
                    </div>
                    <TrendIndicator current={thisWeek.focusMinutes} previous={lastWeek.focusMinutes} suffix=" min" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass p-6 rounded-2xl border border-white/5"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-400/20 rounded-xl flex items-center justify-center">
                            <Target className="text-blue-400" size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-secondary">Projects</h3>
                            <p className="text-3xl font-bold text-white">{thisWeek.projectsWorkedOn}</p>
                        </div>
                    </div>
                    <TrendIndicator current={thisWeek.projectsWorkedOn} previous={lastWeek.projectsWorkedOn} />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-primary/10 to-accent/10"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                            <Trophy className="text-primary" size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-secondary">Overall Progress</h3>
                            <p className="text-xl font-bold text-white">{trendMessage}</p>
                        </div>
                    </div>
                    <p className="text-sm text-secondary">
                        {overallTrend === 'excellent' && 'You outperformed last week! Keep it up!'}
                        {overallTrend === 'good' && 'Consistent pace is the key to success.'}
                        {overallTrend === 'needs-attention' && 'Try starting with simple tasks to build momentum.'}
                    </p>
                </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="glass p-6 rounded-2xl border border-white/5"
            >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <ArrowRight size={20} className="text-primary" />
                    Recommendations for Next Week
                </h3>
                <ul className="space-y-3 text-secondary">
                    {thisWeek.highPriorityDone < 3 && (
                        <li className="flex items-center gap-2">
                            <Flame size={16} className="text-red-400" />
                            Focus on high-priority tasks first
                        </li>
                    )}
                    {thisWeek.focusMinutes < 60 && (
                        <li className="flex items-center gap-2">
                            <Clock size={16} className="text-purple-400" />
                            Try Focus Mode for deep work sessions
                        </li>
                    )}
                    {thisWeek.projectsWorkedOn <= 1 && (
                        <li className="flex items-center gap-2">
                            <Target size={16} className="text-blue-400" />
                            Distribute time across multiple projects
                        </li>
                    )}
                    {thisWeek.tasksCompleted >= lastWeek.tasksCompleted && (
                        <li className="flex items-center gap-2">
                            <Star size={16} className="text-yellow-400" />
                            Set a new goal — beat this week's record!
                        </li>
                    )}
                </ul>
            </motion.div>
        </div>
    );
};
