/**
 * Панель быстрого добавления задач с умным парсингом ввода.
 * Поддерживает хештеги: !high, ~30m, #project
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send } from 'lucide-react';
import { EFFORT_CONFIG, PRIORITY_CONFIG } from '../constants';
import type { Client, Effort, Priority } from '../types';
import { ClientSelector } from './ClientSelector';
import { PrioritySelector } from './PrioritySelector';
import { EffortSelector } from './EffortSelector';

interface QuickTaskBarProps {
    clients: Client[];
    onAddTaskToMany: (clientIds: number[], title: string, priority: Priority, effort: Effort) => void;
}

/**
 * Парсит пользовательский ввод для извлечения приоритета, сложности и проекта.
 */
const parseInput = (text: string, clients: Client[]) => {
    let cleanText = text;
    let detectedPriority: Priority | null = null;
    let detectedEffort: Effort | null = null;
    let detectedClientId: number | null = null;

    const priorityMatch = text.match(/(?:^|\s)!(h|high|n|normal|l|low)\b/i);
    if (priorityMatch) {
        const val = priorityMatch[1].toLowerCase();
        if (val.startsWith('h')) detectedPriority = 'high';
        else if (val.startsWith('l')) detectedPriority = 'low';
        else detectedPriority = 'normal';
        cleanText = cleanText.replace(priorityMatch[0], '');
    }

    const effortMatch = text.match(/(?:^|\s)~(q|quick|5|m|med|30|l|long)\b/i);
    if (effortMatch) {
        const val = effortMatch[1].toLowerCase();
        if (['q', 'quick', '5'].includes(val)) detectedEffort = 'quick';
        else if (['l', 'long'].includes(val)) detectedEffort = 'long';
        else detectedEffort = 'medium';
        cleanText = cleanText.replace(effortMatch[0], '');
    }

    const clientMatch = text.match(/(?:^|\s)#(\w+)/);
    if (clientMatch) {
        const search = clientMatch[1].toLowerCase();
        const found = clients.find(c => c.name.toLowerCase().includes(search));
        if (found) {
            detectedClientId = found.id;
            cleanText = cleanText.replace(clientMatch[0], '');
        }
    }

    return {
        title: cleanText.replace(/\s+/g, ' ').trim(),
        priority: detectedPriority,
        effort: detectedEffort,
        clientId: detectedClientId
    };
};

export const QuickTaskBar: React.FC<QuickTaskBarProps> = ({ clients, onAddTaskToMany }) => {
    const [selectedClientIds, setSelectedClientIds] = useState<Set<number>>(new Set());
    const [inputValue, setInputValue] = useState('');
    const [manualPriority, setManualPriority] = useState<Priority | null>(null);
    const [manualEffort, setManualEffort] = useState<Effort | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // --- Computed State ---
    const parsedData = useMemo(() => parseInput(inputValue, clients), [inputValue, clients]);

    const finalPriority = manualPriority ?? parsedData.priority ?? 'normal';
    const finalEffort = manualEffort ?? parsedData.effort ?? 'quick';

    const finalClientIds = useMemo(() => {
        if (selectedClientIds.size > 0) return Array.from(selectedClientIds);
        if (parsedData.clientId) return [parsedData.clientId];
        return [];
    }, [selectedClientIds, parsedData.clientId]);

    // --- Client Selection Handlers ---
    const toggleClient = (id: number) => {
        setSelectedClientIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const setAll = () => setSelectedClientIds(new Set(clients.map(c => c.id)));
    const clearAll = () => setSelectedClientIds(new Set());

    // --- Effects ---
    useEffect(() => {
        if (!inputValue) {
            setManualPriority(null);
            setManualEffort(null);
        }
    }, [inputValue]);

    // --- Event Handlers ---
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === 'Escape') {
            setIsDropdownOpen(false);
        }
    };

    const handleSubmit = () => {
        if (finalClientIds.length === 0 || !parsedData.title) return;

        onAddTaskToMany(finalClientIds, parsedData.title, finalPriority, finalEffort);

        setInputValue('');
        setManualPriority(null);
        setManualEffort(null);
    };

    return (
        <div className="glass rounded-2xl shadow-zen p-1 relative z-30 mb-10 transition-all focus-within:ring-1 focus-within:ring-primary/30">
            <div className="flex flex-col md:flex-row gap-2 items-center">

                {/* Client Selector */}
                <ClientSelector
                    clients={clients}
                    selectedClientIds={selectedClientIds}
                    parsedClientId={parsedData.clientId}
                    isOpen={isDropdownOpen}
                    onToggleOpen={() => setIsDropdownOpen(!isDropdownOpen)}
                    onToggleClient={toggleClient}
                    onSelectAll={setAll}
                    onClearAll={clearAll}
                />

                {/* Input & Controls */}
                <div className="flex-1 w-full relative flex items-center gap-2 pr-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Task description (use !high, ~30m, #project)..."
                        className="flex-1 w-full bg-transparent text-white px-4 py-3 outline-none placeholder-secondary/30 font-light tracking-wide"
                    />

                    {/* Visual Parsed Indicators */}
                    {(parsedData.priority || parsedData.effort) && (
                        <div className="hidden lg:flex absolute right-40 top-1/2 -translate-y-1/2 gap-2 pointer-events-none opacity-50">
                            {parsedData.priority && !manualPriority && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border border-white/10 ${PRIORITY_CONFIG[parsedData.priority].color}`}>
                                    {PRIORITY_CONFIG[parsedData.priority].label}
                                </span>
                            )}
                            {parsedData.effort && !manualEffort && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border border-white/10 ${EFFORT_CONFIG[parsedData.effort].color}`}>
                                    {EFFORT_CONFIG[parsedData.effort].label}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Priority Selector */}
                    <PrioritySelector
                        value={finalPriority}
                        onChange={setManualPriority}
                    />

                    {/* Effort Selector */}
                    <EffortSelector
                        value={finalEffort}
                        onChange={setManualEffort}
                    />

                    <button
                        onClick={handleSubmit}
                        disabled={finalClientIds.length === 0 || !parsedData.title}
                        className={`
              p-2.5 rounded-xl transition-all font-bold shrink-0 shadow-lg active:scale-95
              ${(finalClientIds.length === 0 || !parsedData.title)
                                ? 'bg-white/5 text-secondary cursor-not-allowed opacity-50'
                                : 'bg-primary/20 hover:bg-primary text-primary hover:text-bg shadow-primary/5'}
            `}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};