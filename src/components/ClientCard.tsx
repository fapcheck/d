import React, { useState } from 'react';
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

export const ClientCard = React.memo<ClientCardProps>(({ client, onClick, onRemove, onUpdatePriority }) => {
  const activeCount = client.tasks.filter(t => !t.isDone).length;
  const doneCount = client.tasks.filter(t => t.isDone).length;
  const [isDeleting, setIsDeleting] = useState(false);

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

  const indicatorColor = PRIORITY_CONFIG[client.priority].indicator;

  return (
    <motion.div
      layout
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ y: -2, scale: 1.01 }}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="glass glass-hover relative p-5 rounded-xl cursor-pointer group overflow-hidden shadow-sm hover:shadow-zen"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${indicatorColor} opacity-70 group-hover:opacity-100 transition-opacity`}></div>

      <div className="flex justify-between items-start mb-3 pl-2">
          <h3 className="text-lg font-semibold text-gray-200 group-hover:text-white transition-colors truncate pr-2 flex-1 tracking-wide">
            {client.name}
          </h3>
          
          <div className="relative h-6">
            <AnimatePresence mode="wait">
              {!isDeleting ? (
                <motion.button 
                  key="trash"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleDeleteClick}
                  className="text-secondary hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Удалить клиента"
                >
                  <Trash2 size={16} />
                </motion.button>
              ) : (
                <motion.div 
                  key="confirm"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-1 bg-surfaceHighlight rounded-lg p-0.5 border border-error/20 absolute right-0 -top-1 z-10"
                >
                  <button onClick={handleDeleteClick} className="p-1 text-error hover:bg-error/10 rounded transition-colors"><Check size={14} /></button>
                  <button onClick={(e) => {e.stopPropagation(); setIsDeleting(false);}} className="p-1 text-secondary hover:text-white rounded transition-colors"><X size={14} /></button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
      </div>

      <div className="flex items-center gap-4 mb-4 text-xs font-medium pl-2">
          <div className="flex items-center gap-1.5 text-secondary group-hover:text-gray-400 transition-colors">
              <ListTodo size={14} />
              <span>Осталось: <span className="text-gray-300">{activeCount}</span></span>
          </div>
          <div className="flex items-center gap-1.5 text-secondary/60 group-hover:text-secondary transition-colors">
              <CheckSquare size={14} />
              <span>{doneCount}</span>
          </div>
      </div>
      
      <div className="pl-2">
        <div className="relative group/prio inline-block w-full" onClick={(e) => e.stopPropagation()}>
            <select 
                value={client.priority}
                onChange={(e) => onUpdatePriority(client.id, e.target.value as Priority)}
                className={`
                  appearance-none w-full bg-transparent text-xs font-bold uppercase cursor-pointer outline-none 
                  py-1 pr-4 transition-colors tracking-wider
                  ${PRIORITY_CONFIG[client.priority].color}
                  opacity-70 group-hover/prio:opacity-100
                `}
            >
                <option value="high" className="bg-surface text-error">🔥 Высокий</option>
                <option value="normal" className="bg-surface text-primary">🔹 Обычный</option>
                <option value="low" className="bg-surface text-success">☕ Низкий</option>
            </select>
            <div className={`absolute left-[-12px] top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover/prio:opacity-100 transition-opacity ${PRIORITY_CONFIG[client.priority].color}`}>
               <ChevronDown size={10} className="-rotate-90" />
            </div>
        </div>
      </div>
    </motion.div>
  );
});