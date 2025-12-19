/**
 * Компонент выбора сложности задачи.
 */

import React from 'react';
import { EFFORT_CONFIG } from '../constants';
import type { Effort } from '../types';

interface EffortSelectorProps {
    value: Effort;
    onChange: (effort: Effort) => void;
}

/**
 * Кнопки выбора сложности: быстро (5 мин), средне (30 мин), долго.
 */
export const EffortSelector: React.FC<EffortSelectorProps> = ({ value, onChange }) => {
    return (
        <div className="flex bg-white/5 rounded-lg p-1 gap-1 shrink-0">
            {(['quick', 'medium', 'long'] as Effort[]).map(e => {
                const Icon = EFFORT_CONFIG[e].icon;
                return (
                    <button
                        key={e}
                        onClick={() => onChange(e)}
                        className={`p-1.5 rounded-md transition-all flex items-center justify-center ${value === e
                            ? `bg-white/10 shadow-sm ${EFFORT_CONFIG[e].color}`
                            : 'text-secondary hover:text-white hover:bg-white/5 opacity-60 hover:opacity-100'
                            }`}
                        title={EFFORT_CONFIG[e].label}
                    >
                        <Icon size={14} />
                    </button>
                );
            })}
        </div>
    );
};
