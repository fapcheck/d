/**
 * Animated streak flame component that grows with streak length.
 * Shows user's current completion streak with fire animation.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreakFlameProps {
    streak: number;
    className?: string;
}

export const StreakFlame: React.FC<StreakFlameProps> = ({ streak, className = '' }) => {
    if (streak === 0) return null;

    // Scale animation intensity based on streak
    const intensity = Math.min(streak / 7, 1); // Max intensity at 7-day streak
    const flameSize = 20 + intensity * 8; // 20-28px

    return (
        <motion.div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 ${className}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
        >
            <motion.div
                animate={{
                    scale: [1, 1.1 + intensity * 0.2, 1],
                    filter: [
                        'drop-shadow(0 0 2px rgba(251, 146, 60, 0.3))',
                        `drop-shadow(0 0 ${8 + intensity * 8}px rgba(251, 146, 60, 0.6))`,
                        'drop-shadow(0 0 2px rgba(251, 146, 60, 0.3))'
                    ]
                }}
                transition={{
                    duration: 0.8 + intensity * 0.4,
                    repeat: Infinity,
                    ease: 'easeInOut'
                }}
            >
                <Flame
                    size={flameSize}
                    className="text-orange-500"
                    fill="rgba(251, 146, 60, 0.3)"
                />
            </motion.div>
            <div className="flex flex-col">
                <span className="text-sm font-bold text-orange-400">
                    {streak} {streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'}
                </span>
                <span className="text-[10px] text-orange-400/60 uppercase tracking-wide">
                    streak
                </span>
            </div>
        </motion.div>
    );
};
