import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Flame, CheckCircle2, Coffee, ListTodo, CheckSquare, SkipForward, Maximize, Minimize } from 'lucide-react';
import { PRIORITY_CONFIG, EFFORT_CONFIG } from '../types';
import type { Client, Task } from '../types';

interface FocusViewProps {
  clients: Client[];
  onToggleTask: (clientId: number, taskId: number) => void;
}

export const FocusView: React.FC<FocusViewProps> = ({ clients, onToggleTask }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const totalActive = clients.reduce((acc, client) => acc + client.tasks.filter(t => !t.isDone).length, 0);
  const totalDone = clients.reduce((acc, client) => acc + client.tasks.filter(t => t.isDone).length, 0);

  const getFocusTask = () => {
    const allTasks: { task: Task; client: Client }[] = [];
    clients.forEach(client => {
      client.tasks.forEach(task => {
        if (!task.isDone) {
          allTasks.push({ task, client });
        }
      });
    });

    if (allTasks.length === 0) return null;
    
    allTasks.sort((a, b) => {
      const taskDiff = PRIORITY_CONFIG[b.task.priority].weight - PRIORITY_CONFIG[a.task.priority].weight;
      if (taskDiff !== 0) return taskDiff;
      const clientDiff = PRIORITY_CONFIG[b.client.priority].weight - PRIORITY_CONFIG[a.client.priority].weight;
      return clientDiff;
    });
    
    return allTasks[0];
  };

  const focusItem = getFocusTask();

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Обработчик изменения полноэкранного режима
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-50 bg-bg flex flex-col items-center justify-center p-8'
    : 'flex flex-col items-center justify-center py-10 w-full max-w-2xl mx-auto min-h-[60vh]';

  return (
    <motion.div 
      key="focus-mode"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className={containerClass}
    >
      {/* Кнопка полноэкранного режима */}
      {!isFullscreen && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={toggleFullscreen}
            className="p-2 glass rounded-xl hover:bg-white/10 transition-colors text-secondary hover:text-white"
            title="Полноэкранный режим"
          >
            <Maximize size={20} />
          </button>
        </div>
      )}

      {focusItem ? (
          <div className="w-full text-center relative z-10">
              <div className={`mb-8 inline-flex items-center gap-2 px-6 py-2 rounded-full bg-accent/10 text-accent text-sm font-bold animate-pulse tracking-widest uppercase ${isFullscreen ? 'text-lg' : ''}`}>
                  <Target size={isFullscreen ? 24 : 18} />
                  Главный приоритет
              </div>
              
              <div className={`bg-surface rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group mb-8 ${isFullscreen ? 'p-16' : 'p-10'}`}>
                  <div className={`absolute top-0 right-0 opacity-5 group-hover:opacity-10 transition-opacity ${isFullscreen ? 'p-20' : 'p-10'}`}>
                      <Flame size={isFullscreen ? 300 : 200} />
                  </div>
                  
                  <div className="relative z-10">
                      <h3 className={`text-secondary mb-4 ${isFullscreen ? 'text-3xl' : 'text-xl'}`}>
                          Клиент: <span className="text-white font-bold">{focusItem.client.name}</span>
                      </h3>
                      
                      <div className={`h-px w-20 bg-white/10 mx-auto mb-8 ${isFullscreen ? 'mx-auto mb-12' : ''}`}></div>
                      
                      <h1 className={`font-bold text-white mb-8 leading-tight ${isFullscreen ? 'text-7xl' : 'text-4xl md:text-5xl'}`}>
                           {focusItem.task.title}
                      </h1>
                      
                      <div className={`flex justify-center gap-4 mb-10 ${isFullscreen ? 'gap-8 mb-16' : ''}`}>
                          <div className={`px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2 ${PRIORITY_CONFIG[focusItem.task.priority].color}`}>
                              <Flame size={isFullscreen ? 24 : 18} />
                              {PRIORITY_CONFIG[focusItem.task.priority].label}
                          </div>
                          <div className={`px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2 ${EFFORT_CONFIG[focusItem.task.effort].color}`}>
                              {React.createElement(EFFORT_CONFIG[focusItem.task.effort].icon, { size: isFullscreen ? 24 : 18 })}
                              {EFFORT_CONFIG[focusItem.task.effort].label}
                          </div>
                      </div>
                      
                      <div className={`flex gap-3 justify-center ${isFullscreen ? 'gap-6' : ''}`}>
                        <button
                          onClick={() => onToggleTask(focusItem.client.id, focusItem.task.id)}
                          className={`bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all ${isFullscreen ? 'px-12 py-8 text-2xl' : 'px-6 py-4'}`}
                        >
                          Пропустить
                        </button>
                        <button
                          onClick={() => onToggleTask(focusItem.client.id, focusItem.task.id)}
                          className={`bg-success hover:bg-success/90 text-bg font-bold rounded-2xl flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-lg shadow-success/20 ${isFullscreen ? 'w-full py-8 text-2xl' : 'w-full py-6 text-xl'}`}
                        >
                          <CheckCircle2 size={isFullscreen ? 48 : 32} />
                          {isFullscreen ? 'Завершить задачу' : 'Готово'}
                        </button>
                      </div>
                  </div>
              </div>
              
              <p className={`text-secondary mb-8 ${isFullscreen ? 'text-xl' : 'text-sm'}`}>
                  Не переключайся, пока не сделаешь это.<br/> Один шаг за раз.
              </p>

              {/* Кнопка выхода из полноэкранного режима */}
              {isFullscreen && (
                <button
                  onClick={toggleFullscreen}
                  className="absolute top-8 right-8 p-3 glass rounded-xl hover:bg-white/10 transition-colors text-secondary hover:text-white"
                  title="Выйти из полноэкранного режима"
                >
                  <Minimize size={24} />
                </button>
              )}
          </div>
      ) : (
          <div className={`text-center text-secondary py-20 mb-8 ${isFullscreen ? 'py-32' : ''}`}>
              <div className={`mb-4 inline-block p-4 bg-surface rounded-full ${isFullscreen ? 'p-8' : ''}`}>
                  <Coffee size={isFullscreen ? 80 : 40} className="text-success" />
              </div>
              <h2 className={`text-white font-bold mb-2 ${isFullscreen ? 'text-5xl' : 'text-2xl'}`}>Все чисто!</h2>
              <p className={isFullscreen ? 'text-xl' : ''}>Нет активных задач. Наслаждайся спокойствием.</p>
          </div>
      )}

      <div className={`flex items-center gap-6 text-secondary/60 bg-surface/50 px-8 py-3 rounded-2xl border border-white/5 backdrop-blur-sm ${isFullscreen ? 'px-12 py-4 text-lg' : ''}`}>
          <div className="flex items-center gap-2">
              <ListTodo size={isFullscreen ? 24 : 18} className={totalActive > 0 ? "text-primary" : ""} />
              <span>Осталось: <strong className="text-white text-lg">{totalActive}</strong></span>
          </div>
          <div className="w-px h-6 bg-white/10"></div>
          <div className="flex items-center gap-2">
              <CheckSquare size={isFullscreen ? 24 : 18} className={totalDone > 0 ? "text-success" : ""} />
              <span>Готово: <strong className="text-white text-lg">{totalDone}</strong></span>
          </div>
      </div>

    </motion.div>
  );
};