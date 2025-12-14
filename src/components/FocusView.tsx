import React from 'react';
import { motion } from 'framer-motion';
import { Target, Flame, CheckCircle2, Coffee } from 'lucide-react';
import { PRIORITY_CONFIG, EFFORT_CONFIG } from '../types';
import type { Client, Task } from '../types';

interface FocusViewProps {
  clients: Client[];
  onToggleTask: (clientId: number, taskId: number) => void;
}

export const FocusView: React.FC<FocusViewProps> = ({ clients, onToggleTask }) => {
  
  const getFocusTask = () => {
    let allTasks: { task: Task; client: Client }[] = [];
    clients.forEach(client => {
      client.tasks.forEach(task => {
        if (!task.isDone) {
          allTasks.push({ task, client });
        }
      });
    });
    
    if (allTasks.length === 0) return null;
    
    allTasks.sort((a, b) => {
      const clientDiff = PRIORITY_CONFIG[b.client.priority].weight - PRIORITY_CONFIG[a.client.priority].weight;
      if (clientDiff !== 0) return clientDiff;
      const taskDiff = PRIORITY_CONFIG[b.task.priority].weight - PRIORITY_CONFIG[a.task.priority].weight;
      return taskDiff;
    });
    
    return allTasks[0];
  };

  const focusItem = getFocusTask();

  return (
    <motion.div 
      key="focus-mode"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="flex flex-col items-center justify-center py-10 w-full max-w-2xl mx-auto"
    >
        {focusItem ? (
            <div className="w-full text-center">
                <div className="mb-8 inline-flex items-center gap-2 px-6 py-2 rounded-full bg-accent/10 text-accent text-sm font-bold animate-pulse tracking-widest uppercase">
                    <Target size={18} />
                    Главный приоритет
                </div>
                <div className="bg-surface p-10 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Flame size={200} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-secondary text-xl mb-4">
                            Клиент: <span className="text-white font-bold">{focusItem.client.name}</span>
                        </h3>
                        <div className="h-px w-20 bg-white/10 mx-auto mb-8"></div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
                            {focusItem.task.title}
                        </h1>
                        <div className="flex justify-center gap-4 mb-10">
                            <div className={`px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2 ${PRIORITY_CONFIG[focusItem.task.priority].color}`}>
                                <Flame size={18} />
                                {PRIORITY_CONFIG[focusItem.task.priority].label}
                            </div>
                            <div className={`px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2 ${EFFORT_CONFIG[focusItem.task.effort].color}`}>
                                {React.createElement(EFFORT_CONFIG[focusItem.task.effort].icon, { size: 18 })}
                                {EFFORT_CONFIG[focusItem.task.effort].label}
                            </div>
                        </div>
                        <button 
                            onClick={() => onToggleTask(focusItem.client.id, focusItem.task.id)}
                            className="w-full py-6 bg-success hover:bg-success/90 text-bg text-xl font-bold rounded-2xl flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-lg shadow-success/20"
                        >
                            <CheckCircle2 size={32} />
                        </button>
                    </div>
                </div>
                <p className="mt-8 text-secondary text-sm">
                    Не переключайся, пока не сделаешь это.<br/> Один шаг за раз.
                </p>
            </div>
        ) : (
            <div className="text-center text-secondary py-20">
                <div className="mb-4 inline-block p-4 bg-surface rounded-full">
                    <Coffee size={40} className="text-success" />
                </div>
                <h2 className="text-2xl text-white font-bold mb-2">Все чисто!</h2>
                <p>Нет активных задач. Наслаждайся спокойствием.</p>
            </div>
        )}
    </motion.div>
  );
};