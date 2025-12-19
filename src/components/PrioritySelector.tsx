/**
 * Компонент выбора приоритета задачи.
 */

import React from 'react';
import { Flame } from 'lucide-react';
import { PRIORITY_CONFIG } from '../constants';
import type { Priority } from '../types';

interface PrioritySelectorProps {
    value: Priority;
    onChange: (priority: Priority) => void;
}

/**
 * Кнопки выбора приоритета: высокий, обычный, низкий.
 */
export const PrioritySelector: React.FC<PrioritySelectorProps> = ({ value, onChange }) => {
    return (
        <div className="flex bg-white/5 rounded-lg p-1 gap-1 shrink-0">
            {(['high', 'normal', 'low'] as Priority[]).map(p => (
                <button
                    key={p}
                    onClick={() => onChange(p)}
                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${value === p
                        ? `bg-white/10 shadow-sm ring-1 ring-white/20 ${PRIORITY_CONFIG[p].color}`
                        : 'hover:bg-white/5 opacity-40 hover:opacity-100 grayscale hover:grayscale-0'
                        }`}
                    title={PRIORITY_CONFIG[p].label}
                >
                    <Flame size={12} fill={value === p ? "currentColor" : "none"} />
                </button>
            ))}
        </div>
    );
};
