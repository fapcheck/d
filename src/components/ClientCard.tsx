import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ListTodo, CheckSquare, ChevronDown, X, Check } from 'lucide-react';
import { PRIORITY_CONFIG } from '../constants';
import type { Client, Priority } from '../types';
import { createPortal } from 'react-dom';

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
      className="glass glass-hover relative p-5 rounded-xl cursor-pointer group shadow-sm hover:shadow-zen hover:z-[100] transition-all"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl ${indicatorColor} opacity-70 group-hover:opacity-100 transition-opacity`}></div>

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
                <button onClick={(e) => { e.stopPropagation(); setIsDeleting(false); }} className="p-1 text-secondary hover:text-white rounded transition-colors"><X size={14} /></button>
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

      <div className="pl-2 mt-auto relative" onClick={(e) => e.stopPropagation()}>
        <PriorityDropdown
          currentPriority={client.priority}
          onUpdate={(p) => onUpdatePriority(client.id, p)}
        />
      </div>
    </motion.div>
  );
});

const PriorityDropdown = ({ currentPriority, onUpdate }: { currentPriority: Priority, onUpdate: (p: Priority) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const config = PRIORITY_CONFIG[currentPriority];

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        isOpen &&
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 8,
        left: rect.left,
        width: Math.max(rect.width, 140)
      });
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
          border border-transparent
          ${isOpen ? 'bg-white/10 text-white border-white/10' : `${config.color} hover:bg-white/5`}
        `}
      >
        <span className="text-sm">{config.icon}</span>
        {config.label}
        <ChevronDown size={12} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && createPortal(
        <AnimatePresence>
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              top: coords.top,
              left: coords.left,
              minWidth: coords.width,
              position: 'fixed'
            }}
            className="bg-[#1C2128] rounded-xl border border-white/10 shadow-2xl overflow-hidden z-[9999] flex flex-col gap-1 p-1"
          >
            {(['high', 'normal', 'low'] as Priority[]).map((p) => (
              <button
                key={p}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate(p);
                  setIsOpen(false);
                }}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all w-full text-left
                  hover:bg-white/10 whitespace-nowrap
                  ${p === currentPriority ? 'bg-white/5 text-white' : PRIORITY_CONFIG[p].color}
                `}
              >
                <span className="text-sm">{PRIORITY_CONFIG[p].icon}</span>
                {PRIORITY_CONFIG[p].label}
              </button>
            ))}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

ClientCard.displayName = 'ClientCard';