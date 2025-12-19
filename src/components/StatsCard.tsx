/**
 * Карточка статистики с иконкой, значением и подписью.
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    /** Иконка карточки */
    icon: LucideIcon;
    /** Цвет иконки и фона (tailwind класс) */
    iconColor: string;
    /** Заголовок метрики */
    title: string;
    /** Основное значение */
    value: string | number;
    /** Подпись под значением */
    subtitle: string;
    /** Индекс для анимации */
    delay?: number;
}

/**
 * Универсальная карточка статистики с анимацией появления.
 */
export const StatsCard: React.FC<StatsCardProps> = ({
    icon: Icon,
    iconColor,
    title,
    value,
    subtitle,
    delay = 0
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="glass p-6 rounded-2xl border border-white/5"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 ${iconColor.includes('bg-') ? iconColor : `bg-${iconColor}/20`} rounded-xl flex items-center justify-center`}>
                    <Icon className={iconColor.replace('bg-', 'text-').replace('/20', '')} size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-medium text-secondary">{title}</h3>
                    <p className="text-2xl font-bold text-white">{value}</p>
                </div>
            </div>
            <div className="text-sm text-secondary">
                {subtitle}
            </div>
        </motion.div>
    );
};
