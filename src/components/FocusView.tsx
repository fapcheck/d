import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Flame, CheckCircle2, Coffee, ListTodo, CheckSquare, 
  Maximize, Minimize, Zap, Timer, ArrowRight 
} from 'lucide-react';
import { PRIORITY_CONFIG, EFFORT_CONFIG } from '../types';
import type { Client, Task, Priority, Effort } from '../types';

interface FocusViewProps {
  clients: Client[];
  onToggleTask: (clientId: number, taskId: number) => void;
}

// --- Scoring Algorithm ---
// Calculates a "Zen Score" to determine the absolute best task to do right now.
// Logic: High Priority > Quick Effort (Momentum) > Client Priority
const calculateTaskScore = (task: Task, client: Client): number => {
  let score = 0;

  // 1. Task Priority (Base Score)
  switch (task.priority) {
    case 'high': score += 1000; break;
    case 'normal': score += 500; break;
    case 'low': score += 100; break;
  }

  // 2. Effort Multiplier (Encourage "Quick Wins" to build momentum)
  // If a task is High Priority AND Quick, it skyrockets to the top.
  if (task.priority === 'high' && task.effort === 'quick') score += 200;
  if (task.priority === 'normal' && task.effort === 'quick') score += 100;

  // 3. Client Importance
  switch (client.priority) {
    case 'high': score += 50; break;
    case 'normal': score += 20; break;
    case 'low': score += 0; break;
  }

  // 4. Age Factor (Older tasks gently bubble up)
  const ageInDays = (Date.now() - task.createdAt) / (1000 * 60 * 60 * 24);
  score += Math.min(ageInDays, 30); // Cap at 30 points

  return score;
};

export const FocusView: React.FC<FocusViewProps> = ({ clients, onToggleTask }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Calculate stats for the footer
  const stats = useMemo(() => {
    let active = 0;
    let done = 0;
    clients.forEach(c => {
      c.tasks.forEach(t => {
        if (t.isDone) done++;
        else active++;
      });
    });
    return { active, done };
  }, [clients]);

  // --- The Smart Selection ---
  const focusItem = useMemo(() => {
    const allCandidates: { task: Task; client: Client; score: number }[] = [];

    clients.forEach(client => {
      client.tasks.forEach(task => {
        if (!task.isDone) {
          allCandidates.push({
            task,
            client,
            score: calculateTaskScore(task, client)
          });
        }
      });
    });

    if (allCandidates.length === 0) return null;

    // Sort by Score Descending
    allCandidates.sort((a, b) => b.score - a.score);
    return allCandidates[0];
  }, [clients]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen toggle failed:", err);
    }
  }, []);

  // Sync state with browser events (e.g., user presses Esc)
  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!focusItem) return;
      
      // Space to complete (if not typing in an input)
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        onToggleTask(focusItem.client.id, focusItem.task.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusItem, onToggleTask]);

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-50 bg-[#0f1117] flex flex-col items-center justify-center p-8'
    : 'flex flex-col items-center justify-center py-10 w-full max-w-2xl mx-auto min-h-[60vh]';

  return (
    <motion.div 
      key="focus-mode"
      layout
      className={containerClass}
    >
      {/* Fullscreen Toggle */}
      {!isFullscreen && (
        <div className="absolute top-0 right-0 z-10">
          <button
            onClick={toggleFullscreen}
            className="p-2 glass rounded-xl hover:bg-white/10 transition-colors text-secondary hover:text-white"
            title="Zen Mode (Fullscreen)"
          >
            <Maximize size={20} />
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {focusItem ? (
          <motion.div 
            key={focusItem.task.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            className="w-full text-center relative z-10 flex flex-col items-center"
          >
              {/* Context Badge */}
              <div className={`mb-6 inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold tracking-widest uppercase border border-primary/20 ${isFullscreen ? 'scale-125 origin-bottom' : ''}`}>
                  <Target size={14} />
                  Текущий фокус
              </div>
              
              {/* Main Card */}
              <div className={`
                bg-surface rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group mb-8 w-full max-w-2xl
                transition-all duration-500
                ${isFullscreen ? 'p-20 scale-110' : 'p-12'}
              `}>
                  {/* Background Ambient Glow */}
                  <div className={`absolute top-0 right-0 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-700 pointer-events-none ${PRIORITY_CONFIG[focusItem.task.priority].color}`}>
                      <Flame size={400} />
                  </div>
                  
                  <div className="relative z-10 flex flex-col items-center">
                      <h3 className="text-secondary mb-6 text-lg tracking-wide flex items-center gap-2">
                          <span className="opacity-50">Проект</span>
                          <ArrowRight size={14} className="opacity-30" />
                          <span className="text-white font-semibold">{focusItem.client.name}</span>
                      </h3>
                      
                      <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8"></div>
                      
                      <h1 className={`font-bold text-white mb-10 leading-tight tracking-tight ${isFullscreen ? 'text-6xl' : 'text-4xl md:text-5xl'}`}>
                           {focusItem.task.title}
                      </h1>
                      
                      {/* Meta Tags */}
                      <div className="flex flex-wrap justify-center gap-4 mb-12">
                          <div className={`px-5 py-2.5 rounded-2xl border border-white/5 flex items-center gap-3 font-medium transition-transform hover:scale-105 ${PRIORITY_CONFIG[focusItem.task.priority].bg} ${PRIORITY_CONFIG[focusItem.task.priority].color}`}>
                              <Flame size={18} />
                              {PRIORITY_CONFIG[focusItem.task.priority].label}
                          </div>
                          
                          <div className={`px-5 py-2.5 rounded-2xl border border-white/5 flex items-center gap-3 font-medium transition-transform hover:scale-105 ${EFFORT_CONFIG[focusItem.task.effort].color} bg-surface`}>
                              {React.createElement(EFFORT_CONFIG[focusItem.task.effort].icon, { size: 18 })}
                              {EFFORT_CONFIG[focusItem.task.effort].label}
                          </div>

                          {focusItem.task.dueDate && (
                             <div className="px-5 py-2.5 rounded-2xl border border-white/5 flex items-center gap-3 text-secondary bg-surface">
                                <Timer size={18} />
                                <span>{new Date(focusItem.task.dueDate).toLocaleDateString()}</span>
                             </div>
                          )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-4 w-full max-w-md">
                        <button
                          onClick={() => {
                            // Skip functionality: Just toggle for now, in a real app this might lower the score temporarily
                            onToggleTask(focusItem.client.id, focusItem.task.id); 
                          }}
                          className="flex-1 bg-white/5 hover:bg-white/10 text-secondary hover:text-white rounded-2xl px-6 py-4 font-medium transition-all"
                        >
                          Отложить
                        </button>
                        
                        <button
                          onClick={() => onToggleTask(focusItem.client.id, focusItem.task.id)}
                          className="flex-[2] bg-success hover:bg-success/90 text-[#0f1117] font-bold rounded-2xl flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-lg shadow-success/20 px-6 py-4 text-lg"
                        >
                          <CheckCircle2 size={24} />
                          <span>Готово</span>
                        </button>
                      </div>
                      
                      {isFullscreen && (
                        <p className="mt-6 text-xs text-secondary/40 font-mono">
                          Нажмите PROBE (Space) для завершения
                        </p>
                      )}
                  </div>
              </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-center text-secondary py-20 mb-8 ${isFullscreen ? 'py-32' : ''}`}
          >
              <motion.div 
                animate={{ 
                    y: [0, -10, 0],
                    filter: ['drop-shadow(0 0 0px rgba(16, 185, 129, 0))', 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.3))', 'drop-shadow(0 0 0px rgba(16, 185, 129, 0))'] 
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className={`mb-8 inline-block p-8 bg-surface rounded-full border border-white/5 ${isFullscreen ? 'scale-150' : ''}`}
              >
                  <Coffee size={48} className="text-success" />
              </motion.div>
              <h2 className={`text-white font-bold mb-4 ${isFullscreen ? 'text-5xl' : 'text-3xl'}`}>
                Поток чист
              </h2>
              <p className={`text-secondary max-w-md mx-auto ${isFullscreen ? 'text-xl' : 'text-base'}`}>
                  Активных задач нет. Наслаждайтесь моментом спокойствия или создайте новый план.
              </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Exit Button */}
      {isFullscreen && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={toggleFullscreen}
          className="absolute top-8 right-8 p-4 glass rounded-2xl hover:bg-white/10 transition-colors text-secondary hover:text-white group"
        >
          <Minimize size={24} className="group-hover:scale-90 transition-transform" />
        </motion.button>
      )}

      {/* Footer Stats */}
      <div className={`flex items-center gap-8 text-secondary/60 bg-surface/50 px-10 py-4 rounded-full border border-white/5 backdrop-blur-md ${isFullscreen ? 'fixed bottom-10 scale-110' : ''}`}>
          <div className="flex items-center gap-3">
              <ListTodo size={18} className={stats.active > 0 ? "text-primary" : ""} />
              <span>Осталось: <strong className="text-white">{stats.active}</strong></span>
          </div>
          <div className="w-px h-6 bg-white/10"></div>
          <div className="flex items-center gap-3">
              <CheckSquare size={18} className={stats.done > 0 ? "text-success" : ""} />
              <span>Готово: <strong className="text-white">{stats.done}</strong></span>
          </div>
      </div>

    </motion.div>
  );
};