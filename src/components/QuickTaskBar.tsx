import React, { useState } from 'react';
import { Send, ChevronDown } from 'lucide-react';
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

    const handleAdd = () => {
        if (!quickClientId || !quickTaskTitle.trim()) return;
        onAddTask(Number(quickClientId), quickTaskTitle.trim(), quickTaskPriority, quickTaskEffort);
        setQuickTaskTitle('');
        setQuickTaskEffort('quick');
        setQuickTaskPriority('normal');
    };

    return (
        <div className="glass rounded-2xl shadow-zen p-1 relative overflow-visible z-20 mb-10">
            <div className="flex flex-col md:flex-row gap-2 items-center">
                
                <div className="w-full md:w-1/4 relative group">
                    <select 
                        value={quickClientId} 
                        onChange={(e) => setQuickClientId(e.target.value)} 
                        className="w-full bg-transparent text-white px-4 py-3 rounded-xl focus:outline-none cursor-pointer appearance-none font-medium hover:bg-white/5 transition-colors"
                    >
                        <option value="" disabled className="bg-surface text-secondary">Кому задача?</option>
                        {clients.map(c => <option key={c.id} value={c.id} className="bg-surface text-white">{c.name}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-3.5 pointer-events-none text-secondary group-hover:text-white transition-colors" />
                    <div className="absolute right-0 top-2 bottom-2 w-px bg-white/5 hidden md:block"></div>
                </div>
                
                <div className="flex-1 w-full relative flex items-center gap-2 pr-2">
                    <input 
                        type="text" 
                        value={quickTaskTitle} 
                        onChange={(e) => setQuickTaskTitle(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()} 
                        placeholder="Суть задачи..." 
                        className="flex-1 w-full bg-transparent text-white px-4 py-3 outline-none placeholder-secondary/40"
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
                        className="bg-primary/20 hover:bg-primary hover:text-bg text-primary p-2.5 rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed font-bold shrink-0"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};