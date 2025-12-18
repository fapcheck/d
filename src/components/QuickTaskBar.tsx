import React, { useState } from 'react';
import { Send, ChevronDown, Check, User, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EFFORT_CONFIG, PRIORITY_CONFIG } from '../types';
import type { Client, Effort, Priority } from '../types';

interface QuickTaskBarProps {
    clients: Client[];
    onAddTask: (clientId: number, title: string, priority: Priority, effort: Effort) => void;
}

export const QuickTaskBar: React.FC<QuickTaskBarProps> = ({ clients, onAddTask }) => {
    const [quickClientId, setQuickClientId] = useState<string>('');
    const [quickTaskTitle, setQuickTaskTitle] = useState('');
    const [quickTaskEffort, setQuickTaskEffort] = useState<Effort>('quick');
    const [quickTaskPriority, setQuickTaskPriority] = useState<Priority>('normal');
    
    // Состояние для кастомного дропдауна
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleAdd = () => {
        if (!quickClientId || !quickTaskTitle.trim()) return;
        onAddTask(Number(quickClientId), quickTaskTitle.trim(), quickTaskPriority, quickTaskEffort);
        setQuickTaskTitle('');
        setQuickTaskEffort('quick');
        setQuickTaskPriority('normal');
    };

    const selectedClient = clients.find(c => c.id.toString() === quickClientId);

    return (
        <div className="glass rounded-2xl shadow-zen p-1 relative z-30 mb-10">
            {/* Невидимая подложка для закрытия меню при клике снаружи */}
            {isDropdownOpen && (
                <div 
                    className="fixed inset-0 z-30 cursor-default" 
                    onClick={() => setIsDropdownOpen(false)} 
                />
            )}

            <div className="flex flex-col md:flex-row gap-2 items-center">
                
                {/* Кастомный селектор клиента */}
                <div className="w-full md:w-1/4 relative group z-40">
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`
                            w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 outline-none
                            ${isDropdownOpen ? 'bg-white/10 text-white' : 'bg-transparent text-secondary hover:text-white hover:bg-white/5'}
                        `}
                    >
                        <span className="truncate flex items-center gap-2 font-medium">
                            {selectedClient ? (
                                <>
                                    <Briefcase size={16} className="text-primary" />
                                    {selectedClient.name}
                                </>
                            ) : (
                                "Кому задача?"
                            )}
                        </span>
                        <ChevronDown 
                            size={16} 
                            className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-primary' : ''}`} 
                        />
                    </button>

                    {/* Выпадающий список */}
                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute top-full left-0 right-0 mt-2 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-[#161b22]/95 backdrop-blur-xl shadow-2xl p-1 z-50 custom-scrollbar"
                            >
                                {clients.length === 0 ? (
                                    <div className="p-4 text-center text-secondary text-sm">
                                        Нет активных проектов
                                    </div>
                                ) : (
                                    clients.map(client => (
                                        <button
                                            key={client.id}
                                            onClick={() => {
                                                setQuickClientId(client.id.toString());
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`
                                                w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5 last:mb-0
                                                ${quickClientId === client.id.toString() 
                                                    ? 'bg-primary/20 text-white' 
                                                    : 'text-gray-400 hover:text-white hover:bg-white/10'}
                                            `}
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${quickClientId === client.id.toString() ? 'bg-primary/20 text-primary' : 'bg-white/5 text-secondary'}`}>
                                                    {client.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="truncate">{client.name}</span>
                                            </div>
                                            {quickClientId === client.id.toString() && (
                                                <Check size={14} className="text-primary" />
                                            )}
                                        </button>
                                    ))
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    {/* Разделитель (виден только на десктопе) */}
                    <div className="absolute right-0 top-2 bottom-2 w-px bg-white/5 hidden md:block pointer-events-none"></div>
                </div>
                
                {/* Поле ввода и настройки */}
                <div className="flex-1 w-full relative flex items-center gap-2 pr-2">
                     <input 
                        type="text" 
                        value={quickTaskTitle} 
                        onChange={(e) => setQuickTaskTitle(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()} 
                        placeholder="Суть задачи..." 
                        className="flex-1 w-full bg-transparent text-white px-4 py-3 outline-none placeholder-secondary/40 font-light tracking-wide"
                    />
             
                    <div className="flex bg-white/5 rounded-lg p-1 gap-1 shrink-0">
                        {(['high', 'normal', 'low'] as Priority[]).map(p => (
                            <button
                                key={p}
                                onClick={() => setQuickTaskPriority(p)}
                                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                                    quickTaskPriority === p 
                                    ? 'bg-white/10 shadow-sm ring-1 ring-white/20' 
                                    : 'hover:bg-white/5 opacity-50 hover:opacity-100'
                                }`}
                                title={PRIORITY_CONFIG[p].label}
                            >
                                <div className={`w-2 h-2 rounded-full ${PRIORITY_CONFIG[p].bg.replace('/20', '')}`}></div>
                            </button>
                        ))}
                    </div>

                    <div className="flex bg-white/5 rounded-lg p-1 gap-1 shrink-0">
                        {(['quick', 'medium', 'long'] as Effort[]).map(e => {
                            const Icon = EFFORT_CONFIG[e].icon;
                            return (
                                <button
                                    key={e}
                                    onClick={() => setQuickTaskEffort(e)}
                                    className={`p-1.5 rounded-md transition-all flex items-center justify-center ${
                                        quickTaskEffort === e 
                                            ? 'bg-white/10 text-white shadow-sm' 
                                            : 'text-secondary hover:text-white hover:bg-white/5'
                                    }`}
                                    title={EFFORT_CONFIG[e].label}
                                >
                                    <Icon size={14} className={quickTaskEffort === e ? EFFORT_CONFIG[e].color : ''} />
                                </button>
                            );
                        })}
                    </div>

                    <button 
                        onClick={handleAdd} 
                        disabled={!quickClientId || !quickTaskTitle.trim()} 
                        className="bg-primary/20 hover:bg-primary hover:text-bg text-primary p-2.5 rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed font-bold shrink-0 shadow-lg shadow-primary/5 active:scale-95"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};