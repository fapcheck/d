import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, ChevronDown, Check, Briefcase, Zap, Clock, Coffee, Flame, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EFFORT_CONFIG, PRIORITY_CONFIG } from '../types';
import type { Client, Effort, Priority } from '../types';

interface QuickTaskBarProps {
    clients: Client[];
    onAddTask: (clientId: number, title: string, priority: Priority, effort: Effort) => void;
}

// --- Smart Parsing Logic ---
// Extracts metadata from the input string (e.g., "Fix bug !high ~30m")
const parseInput = (text: string, clients: Client[]) => {
    let cleanText = text;
    let detectedPriority: Priority | null = null;
    let detectedEffort: Effort | null = null;
    let detectedClientId: number | null = null;

    // 1. Parse Priority (!h, !high, !urg)
    const priorityMatch = text.match(/(?:^|\s)!(h|high|n|normal|l|low)\b/i);
    if (priorityMatch) {
        const val = priorityMatch[1].toLowerCase();
        if (val.startsWith('h')) detectedPriority = 'high';
        else if (val.startsWith('l')) detectedPriority = 'low';
        else detectedPriority = 'normal';
        cleanText = cleanText.replace(priorityMatch[0], '');
    }

    // 2. Parse Effort (~q, ~5, ~m, ~30)
    const effortMatch = text.match(/(?:^|\s)~(q|quick|5|m|med|30|l|long)\b/i);
    if (effortMatch) {
        const val = effortMatch[1].toLowerCase();
        if (['q', 'quick', '5'].includes(val)) detectedEffort = 'quick';
        else if (['l', 'long'].includes(val)) detectedEffort = 'long';
        else detectedEffort = 'medium';
        cleanText = cleanText.replace(effortMatch[0], '');
    }

    // 3. Parse Client (#ClientName - partial match)
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
        title: cleanText.replace(/\s+/g, ' ').trim(), // Remove double spaces
        priority: detectedPriority,
        effort: detectedEffort,
        clientId: detectedClientId
    };
};

export const QuickTaskBar: React.FC<QuickTaskBarProps> = ({ clients, onAddTask }) => {
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [inputValue, setInputValue] = useState('');
    
    // Explicit overrides (user clicks buttons) vs Implicit (parsed from text)
    const [manualPriority, setManualPriority] = useState<Priority | null>(null);
    const [manualEffort, setManualEffort] = useState<Effort | null>(null);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    // --- Computed State ---
    const parsedData = useMemo(() => parseInput(inputValue, clients), [inputValue, clients]);
    
    // Final values prefer Manual override > Parsed value > Default
    const finalPriority = manualPriority ?? parsedData.priority ?? 'normal';
    const finalEffort = manualEffort ?? parsedData.effort ?? 'quick';
    const finalClientId = selectedClientId ?? parsedData.clientId;
    const finalClient = clients.find(c => c.id === finalClientId);

    // --- Event Handlers ---

    // Handle outside click to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset manual overrides when input clears
    useEffect(() => {
        if (!inputValue) {
            setManualPriority(null);
            setManualEffort(null);
            // We don't reset Client ID intentionally to allow rapid entry for same client
        }
    }, [inputValue]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === 'ArrowDown' && isDropdownOpen) {
            e.preventDefault();
            setHighlightedIndex(prev => (prev + 1) % clients.length);
        } else if (e.key === 'ArrowUp' && isDropdownOpen) {
            e.preventDefault();
            setHighlightedIndex(prev => (prev - 1 + clients.length) % clients.length);
        } else if (e.key === 'Enter' && isDropdownOpen) {
            // Select highlighted client
            e.preventDefault();
            if (clients[highlightedIndex]) {
                setSelectedClientId(clients[highlightedIndex].id);
                setIsDropdownOpen(false);
                inputRef.current?.focus();
            }
        } else if (e.key === 'Escape') {
            setIsDropdownOpen(false);
        }
    };

    const handleSubmit = () => {
        if (!finalClientId || !parsedData.title) return; // Basic validation
        
        onAddTask(finalClientId, parsedData.title, finalPriority, finalEffort);
        
        // Reset only transient state
        setInputValue('');
        setManualPriority(null);
        setManualEffort(null);
        // Keep selected client for subsequent tasks (workflow optimization)
    };

    return (
        <div className="glass rounded-2xl shadow-zen p-1 relative z-30 mb-10 transition-all focus-within:ring-1 focus-within:ring-primary/30">
            <div className="flex flex-col md:flex-row gap-2 items-center">
                
                {/* --- Client Selector --- */}
                <div className="w-full md:w-1/4 relative z-40" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`
                            w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 outline-none
                            ${isDropdownOpen ? 'bg-white/10 text-white' : 'bg-transparent text-secondary hover:text-white hover:bg-white/5'}
                        `}
                    >
                        <span className="truncate flex items-center gap-2 font-medium">
                            {finalClient ? (
                                <>
                                    <Briefcase size={16} className="text-primary" />
                                    {finalClient.name}
                                </>
                            ) : (
                                <span className="opacity-50 flex items-center gap-2">
                                    <Hash size={16} /> Проект...
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
                                className="absolute top-full left-0 right-0 mt-2 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-[#161b22] shadow-2xl p-1 z-50 scrollbar-thin scrollbar-thumb-white/10"
                            >
                                {clients.length === 0 ? (
                                    <div className="p-4 text-center text-secondary text-sm">Нет проектов</div>
                                ) : (
                                    clients.map((client, index) => (
                                        <button
                                            key={client.id}
                                            onClick={() => {
                                                setSelectedClientId(client.id);
                                                setIsDropdownOpen(false);
                                                inputRef.current?.focus();
                                            }}
                                            className={`
                                                w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5 last:mb-0
                                                ${finalClientId === client.id ? 'bg-primary/20 text-white' : 'text-gray-400'}
                                                ${highlightedIndex === index ? 'bg-white/5 text-white' : ''}
                                            `}
                                            onMouseEnter={() => setHighlightedIndex(index)}
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${finalClientId === client.id ? 'bg-primary/20 text-primary' : 'bg-white/5 text-secondary'}`}>
                                                    {client.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="truncate">{client.name}</span>
                                            </div>
                                            {finalClientId === client.id && <Check size={14} className="text-primary" />}
                                        </button>
                                    ))
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    {/* Divider for desktop */}
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

                    {/* Visual Parsed Indicators (Ghost Pills) */}
                    {(parsedData.priority || parsedData.effort) && (
                        <div className="hidden lg:flex absolute right-40 top-1/2 -translate-y-1/2 gap-2 pointer-events-none opacity-50">
                            {parsedData.priority && !manualPriority && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border border-white/10 ${PRIORITY_CONFIG[parsedData.priority].color}`}>
                                    {PRIORITY_CONFIG[parsedData.priority].label} detected
                                </span>
                            )}
                            {parsedData.effort && !manualEffort && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border border-white/10 ${EFFORT_CONFIG[parsedData.effort].color}`}>
                                    {EFFORT_CONFIG[parsedData.effort].label} detected
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
                        disabled={!finalClientId || !parsedData.title} 
                        className={`
                            p-2.5 rounded-xl transition-all font-bold shrink-0 shadow-lg active:scale-95
                            ${(!finalClientId || !parsedData.title) 
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