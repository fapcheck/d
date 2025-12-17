import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, RotateCw, Clock, CheckCircle, Plus, Trash2, Edit, User } from 'lucide-react';
import type { HistoryEntry } from '../types';

interface HistoryPanelProps {
  history: HistoryEntry[];
  onUndo: (entryId: number) => void;
  onRedo: (entryId: number) => void;
  className?: string;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onUndo,
  onRedo,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'tasks' | 'clients'>('all');

  const getActionIcon = (type: HistoryEntry['type']) => {
    switch (type) {
      case 'task_create':
        return <Plus size={14} className="text-green-400" />;
      case 'task_complete':
        return <CheckCircle size={14} className="text-success" />;
      case 'task_delete':
      case 'client_remove':
        return <Trash2 size={14} className="text-red-400" />;
      case 'task_update':
      case 'client_add':
        return <Edit size={14} className="text-primary" />;
      default:
        return <Clock size={14} className="text-secondary" />;
    }
  };

  const getActionLabel = (type: HistoryEntry['type']) => {
    switch (type) {
      case 'task_create':
        return 'Создана задача';
      case 'task_complete':
        return 'Задача выполнена';
      case 'task_delete':
        return 'Задача удалена';
      case 'task_update':
        return 'Задача обновлена';
      case 'client_add':
        return 'Добавлен проект';
      case 'client_remove':
        return 'Проект удален';
      default:
        return 'Неизвестное действие';
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days} дн. назад`;
    if (hours > 0) return `${hours} ч. назад`;
    if (minutes > 0) return `${minutes} мин. назад`;
    return 'Только что';
  };

  const filteredHistory = history.filter(entry => {
    if (filter === 'tasks') return entry.type.startsWith('task_');
    if (filter === 'clients') return entry.type.startsWith('client_');
    return true;
  });

  return (
    <>
      {/* Кнопка открытия */}
      <button
        onClick={() => setIsOpen(true)}
        className="glass hover:bg-white/10 text-secondary hover:text-white p-3 rounded-xl transition-colors shadow-sm relative"
        title="История изменений"
      >
        <Clock size={20} />
        {history.length > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {history.length > 9 ? '9+' : history.length}
            </span>
          </div>
        )}
      </button>

      {/* Панель истории */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-surface border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 max-h-[80vh] flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Clock className="text-primary" size={28} />
                  История изменений
                </h2>
                <p className="text-secondary text-sm mt-1">
                  Последние действия и возможность отмены
                </p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-secondary transition-colors">
                ✕
              </button>
            </div>

            {/* Фильтры */}
            <div className="p-4 border-b border-white/5">
              <div className="flex gap-2">
                {(['all', 'tasks', 'clients'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      filter === f 
                        ? 'bg-primary/20 text-primary' 
                        : 'text-secondary hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {f === 'all' ? 'Все' : f === 'tasks' ? 'Задачи' : 'Проекты'}
                  </button>
                ))}
              </div>
            </div>

            {/* Список истории */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-12 text-secondary/40">
                  <Clock size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-light">История пуста</p>
                  <p className="text-sm">Начните работу, чтобы увидеть изменения здесь</p>
                </div>
              ) : (
                filteredHistory.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-bg/50 rounded-xl border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {getActionIcon(entry.type)}
                      <div>
                        <div className="text-sm font-medium text-white">
                          {getActionLabel(entry.type)}
                        </div>
                        <div className="text-xs text-secondary mt-1">
                          {entry.description}
                        </div>
                        <div className="text-xs text-secondary/60 mt-1 flex items-center gap-1">
                          <User size={10} />
                          {entry.userId}
                          <span className="mx-1">•</span>
                          {formatTime(entry.timestamp)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => onUndo(entry.id)}
                        className="p-2 text-secondary hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                        title="Отменить"
                      >
                        <RotateCcw size={16} />
                      </button>
                      <button
                        onClick={() => onRedo(entry.id)}
                        className="p-2 text-secondary hover:text-success hover:bg-success/10 rounded-lg transition-colors"
                        title="Повторить"
                      >
                        <RotateCw size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};