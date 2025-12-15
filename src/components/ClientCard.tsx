import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ListTodo, CheckSquare, ChevronDown, X, Check } from 'lucide-react';
import { PRIORITY_CONFIG } from '../types';
import type { Client, Priority } from '../types';

interface ClientCardProps {
  client: Client;
  onClick: () => void;
  onRemove: (id: number) => void;
  onUpdatePriority: (id: number, priority: Priority) => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({ client, onClick, onRemove, onUpdatePriority }) => {
  const activeCount = client.tasks.filter(t => !t.isDone).length;
  const doneCount = client.tasks.filter(t => t.isDone).length;
  const [isDeleting, setIsDeleting] = useState(false);

  // Сброс состояния удаления, если увели курсор (защита от мискликов)
  const handleMouseLeave = () => {
    if (isDeleting) setIsDeleting(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) {
      onRemove(client.id);
    } else {
      setIsDeleting(true);
    }
  };

  return (
    <motion.div 
      layout
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`bg-surface p-6 rounded-2xl cursor-pointer hover:bg-white/5 border-l-4 ${PRIORITY_CONFIG[client.priority].border} transition-all group relative overflow-visible shadow-md hover:shadow-xl hover:-translate-y-1`}
    >
      <div className="flex justify-between items-start mb-4 h-8">
          <h3 className="text-xl font-bold text-white truncate pr-2 flex-1">{client.name}</h3>
          
          {/* Умная кнопка удаления */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {!isDeleting ? (
                <motion.button 
                  key="trash"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleDeleteClick}
                  className="text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  title="Удалить клиента"
                >
                  <Trash2 size={18} />
                </motion.button>
              ) : (
                <motion.div 
                  key="confirm"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-1 bg-bg/80 rounded-lg p-1 border border-red-500/30 backdrop-blur-sm absolute right-0 -top-1 z-10"
                >
                  <button 
                    onClick={handleDeleteClick}
                    className="p-1 text-red-400 hover:bg-red-500/20 rounded-md transition-colors"
                    title="Подтвердить удаление"
                  >
                    <Check size={16} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsDeleting(false); }}
                    className="p-1 text-secondary hover:text-white hover:bg-white/10 rounded-md transition-colors"
                    title="Отмена"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1.5 text-secondary">
              <ListTodo size={14} />
              <span>Осталось: <strong className="text-white">{activeCount}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-secondary opacity-60">
              <CheckSquare size={14} />
              <span>Сделано: <strong>{doneCount}</strong></span>
          </div>
      </div>
      
      <div className="h-px w-full bg-white/5 mb-3"></div>
      
      <div className="relative group/prio" onClick={(e) => e.stopPropagation()}>
          <select 
              value={client.priority}
              onChange={(e) => onUpdatePriority(client.id, e.target.value as Priority)}
              className={`appearance-none w-full pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold uppercase cursor-pointer outline-none bg-bg/50 hover:bg-bg transition-colors ${PRIORITY_CONFIG[client.priority].color}`}
          >
              <option value="high">🔥 Важно</option>
              <option value="normal">🔹 Обычно</option>
              <option value="low">☕ Не спеша</option>
          </select>
          <div className={`absolute right-3 top-2 pointer-events-none ${PRIORITY_CONFIG[client.priority].color}`}>
             <ChevronDown size={12} />
          </div>
      </div>
    </motion.div>
  );
};