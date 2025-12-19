import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, RotateCw, Clock, CheckCircle, Plus, Trash2, Edit, User } from 'lucide-react';
import type { HistoryEntry } from '../types';

interface HistoryPanelProps {
  history: HistoryEntry[];
  onUndo: (entryId: number) => void;
  onRedo: (entryId: number) => void;
  isOpen: boolean;
  onClose: () => void;
  currentIndex: number;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onUndo,
  onRedo,
  isOpen,
  onClose,
  currentIndex
}) => {
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
      case 'task_create': return 'Task Created';
      case 'task_complete': return 'Task Completed';
      case 'task_delete': return 'Task Deleted';
      case 'task_update': return 'Task Updated';
      case 'client_add': return 'Project Added';
      case 'client_remove': return 'Project Deleted';
      default: return 'Unknown Action';
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const filteredHistory = history.filter(entry => {
    if (filter === 'tasks') return entry.type.startsWith('task_');
    if (filter === 'clients') return entry.type.startsWith('client_');
    return true;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-[#161b22] border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 max-h-[80vh] flex flex-col"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Clock className="text-primary" size={28} />
                  History
                </h2>
                <p className="text-secondary text-sm mt-1">
                  Recent actions and undo/redo
                </p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-secondary transition-colors">
                ✕
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="p-4 border-b border-white/5">
              <div className="flex gap-2">
                {(['all', 'tasks', 'clients'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${filter === f
                      ? 'bg-primary/20 text-primary'
                      : 'text-secondary hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {f === 'all' ? 'All' : f === 'tasks' ? 'Tasks' : 'Projects'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-12 text-secondary/40">
                  <Clock size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-light">No history yet</p>
                </div>
              ) : (
                filteredHistory.map((entry) => {
                  const trueIndex = history.findIndex(h => h.id === entry.id);
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-center justify-between p-4 bg-white/5 rounded-xl border transition-all ${trueIndex > currentIndex ? 'opacity-50 border-white/5' : 'border-white/10'
                        }`}
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
                        {trueIndex === currentIndex && (
                          <button
                            onClick={() => onUndo(entry.id)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary hover:text-white rounded-lg transition-all text-xs border border-primary/20 shadow-sm"
                            title="Undo this action"
                          >
                            <RotateCcw size={12} />
                            <span>Undo</span>
                          </button>
                        )}
                        {trueIndex === currentIndex + 1 && (
                          <button
                            onClick={() => onRedo(entry.id)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-secondary hover:text-white rounded-lg transition-all text-xs border border-white/5"
                            title="Redo this action"
                          >
                            <RotateCw size={12} />
                            <span>Redo</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div >
      )}
    </AnimatePresence >
  );
};