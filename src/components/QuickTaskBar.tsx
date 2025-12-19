import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, ChevronDown, Check, Briefcase, Zap, Clock, Coffee, Flame, Hash, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EFFORT_CONFIG, PRIORITY_CONFIG } from '../types';
import type { Client, Effort, Priority } from '../types';

interface QuickTaskBarProps {
    clients: Client[];
    // Переходим на пакетное добавление
    onAddTaskToMany: (clientIds: number[], title: string, priority: Priority, effort: Effort) => void;
}

// --- Smart Parsing Logic ---
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
    // Множественный выбор через Set
    const [selectedClientIds, setSelectedClientIds] = useState<Set<number>>(new Set());
    const [inputValue, setInputValue] = useState('');
    
    const [manualPriority, setManualPriority] = useState<Priority | null>(null);
    const [manualEffort, setManualEffort] = useState<Effort | null>(null);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // --- Computed State ---
    const allSelected = clients.length > 0 && selectedClientIds.size === clients.length;
    const parsedData = useMemo(() => parseInput(inputValue, clients), [inputValue, clients]);
    
    const finalPriority = manualPriority ?? parsedData.priority ?? 'normal';
    const finalEffort = manualEffort ?? parsedData.effort ?? 'quick';

    // Итоговый список ID: если выбрано вручную — берем их, иначе пробуем распарсить из текста
    const finalClientIds = useMemo(() => {
        if (selectedClientIds.size > 0) return Array.from(selectedClientIds);
        if (parsedData.clientId) return [parsedData.clientId];
        return [];
    }, [selectedClientIds, parsedData.clientId]);

    // Текст для кнопки выбора проектов
    const selectionLabel = useMemo(() => {
        if (allSelected) return `ALL (${clients.length})`;
        if (selectedClientIds.size > 1) return `Выбрано: ${selectedClientIds.size}`;
        if (selectedClientIds.size === 1) {
            const id = Array.from(selectedClientIds)[0];
            return clients.find(c => c.id === id)?.name || 'Проект...';
        }
        if (parsedData.clientId) {
            return clients.find(c => c.id === parsedData.clientId)?.name || 'Проект...';
        }
        return 'Проект...';
    }, [allSelected, selectedClientIds, clients, parsedData.clientId]);

    // --- Helpers for Selection ---
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

    // --- Event Handlers ---
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!inputValue) {
            setManualPriority(null);
            setManualEffort(null);
        }
    }, [inputValue]);

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
        // Не сбрасываем выбор проектов для возможности быстрого ввода следующей задачи
    };

    return (
        <div className="glass rounded-2xl shadow-zen p-1 relative z-30 mb-10 transition-all focus-within:ring-1 focus-within:ring-primary/30">
            <div className="flex flex-col md:flex-row gap-2 items-center">
                
                {/* --- Client Selector (Multi) --- */}
                <div className="w-full md:w-1/4 relative z-40" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`
                            w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 outline-none
                            ${isDropdownOpen ? 'bg-white/10 text-white' : 'bg-transparent text-secondary hover:text-white hover:bg-white/5'}
                        `}
                    >
                        <span className="truncate flex items-center gap-2 font-medium">
                            {finalClientIds.length > 0 ? (
                                <>
                                    {allSelected ? <Users size={16} className="text-primary" /> : <Briefcase size={16} className="text-primary" />}
                                    {selectionLabel}
                                </>
                            ) : (
                                <span className="opacity-50 flex items-center gap-2">
                                    <Hash size={16} /> {selectionLabel}
                                </span>
                            )}
                        </span>
                        <ChevronDown 
                            size={16} 
                            className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-primary' : ''}`} 
                        />
                    </button>

                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-full left-0 right-0 mt-2 max-h-80 overflow-y-auto rounded-xl border border-white/10 bg-[#161b22] shadow-2xl p-1 z-50 scrollbar-thin scrollbar-thumb-white/10"
                            >
                                {clients.length === 0 ? (
                                    <div className="p-4 text-center text-secondary text-sm">Нет проектов</div>
                                ) : (
                                    <>
                                        {/* Row: ALL */}
                                        <button
                                            onClick={() => (allSelected ? clearAll() : setAll())}
                                            className={`
                                                w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all mb-1
                                                ${allSelected ? 'bg-primary/20 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                                            `}
                                        >
                                            <span className="truncate font-bold tracking-wider">ВСЕ ПРОЕКТЫ</span>
                                            <span className="text-[10px] opacity-50 uppercase">
                                                {allSelected ? 'Выбрано' : `Выбрать (${clients.length})`}
                                            </span>
                                        </button>

                                        <div className="h-px bg-white/5 my-1 mx-2" />

                                        {/* Individual Clients */}
                                        {clients.map((client) => {
                                            const isChecked = selectedClientIds.has(client.id);
                                            return (
                                                <button
                                                    key={client.id}
                                                    onClick={() => toggleClient(client.id)}
                                                    className={`
                                                        w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5 last:mb-0
                                                        ${isChecked ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                                                    `}
                                                >
                                                    <div className="flex items-center gap-2 truncate">
                                                        <div className={`w-5 h-5 rounded border border-white/10 flex items-center justify-center transition-colors ${isChecked ? 'bg-primary/30 border-primary/50' : 'bg-transparent'}`}>
                                                            {isChecked && <Check size={12} className="text-primary" />}
                                                        </div>
                                                        <span className="truncate">{client.name}</span>
                                                    </div>
                                                    <span className="text-[10px] text-secondary opacity-50">
                                                        {client.tasks.filter(t => !t.isDone).length} активных
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    <div className="absolute right-0 top-2 bottom-2 w-px bg-white/5 hidden md:block pointer-events-none"></div>
                </div>
                
                {/* --- Input & Controls --- */}
                <div className="flex-1 w-full relative flex items-center gap-2 pr-2">
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={inputValue} 
                        onChange={(e) => setInputValue(e.target.value)} 
                        onKeyDown={handleKeyDown}
                        placeholder="Суть задачи (используйте !high, ~30m, #project)..." 
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
                    <div className="flex bg-white/5 rounded-lg p-1 gap-1 shrink-0">
                        {(['high', 'normal', 'low'] as Priority[]).map(p => (
                            <button
                                key={p}
                                onClick={() => setManualPriority(p)}
                                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                                    finalPriority === p 
                                    ? `bg-white/10 shadow-sm ring-1 ring-white/20 ${PRIORITY_CONFIG[p].color}` 
                                    : 'hover:bg-white/5 opacity-40 hover:opacity-100 grayscale hover:grayscale-0'
                                }`}
                                title={PRIORITY_CONFIG[p].label}
                            >
                                <Flame size={12} fill={finalPriority === p ? "currentColor" : "none"} />
                            </button>
                        ))}
                    </div>

                    {/* Effort Selector */}
                    <div className="flex bg-white/5 rounded-lg p-1 gap-1 shrink-0">
                        {(['quick', 'medium', 'long'] as Effort[]).map(e => {
                            const Icon = EFFORT_CONFIG[e].icon;
                            return (
                                <button
                                    key={e}
                                    onClick={() => setManualEffort(e)}
                                    className={`p-1.5 rounded-md transition-all flex items-center justify-center ${
                                        finalEffort === e 
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