import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, GripVertical } from 'lucide-react';

import { PRIORITY_CONFIG, EFFORT_CONFIG } from '../types';
import type { Task } from '../types';

interface SortableTaskItemProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onUpdateTitle: (newTitle: string) => void;
}

export const SortableTaskItem: React.FC<SortableTaskItemProps> = ({ task, onToggle, onDelete, onUpdateTitle }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1, 
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
      if (isEditing && inputRef.current) {
          inputRef.current.focus();
      }
  }, [isEditing]);

  const handleSave = () => {
      if (editTitle.trim()) {
          onUpdateTitle(editTitle);
      } else {
          setEditTitle(task.title); // Revert if empty
      }
      setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSave();
      if (e.key === 'Escape') {
          setEditTitle(task.title);
          setIsEditing(false);
      }
  };

  return (
    <div 
        ref={setNodeRef} 
        style={style} 
        className="bg-surface p-4 rounded-2xl flex items-center justify-between group border border-white/5 hover:border-white/10 transition-colors"
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="mr-3 cursor-grab active:cursor-grabbing text-secondary/30 hover:text-secondary"
      >
          <GripVertical size={20} />
      </div>

      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button 
          onClick={onToggle}
          className="w-6 h-6 rounded-full border-2 border-secondary/50 hover:border-success hover:bg-success/10 transition-all shrink-0"
        />
        <div className="flex-1 min-w-0">
          {isEditing ? (
              <input 
                ref={inputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="bg-bg text-white px-2 py-1 rounded w-full outline-none border border-primary/50 text-lg"
              />
          ) : (
              <div 
                onDoubleClick={() => setIsEditing(true)}
                className="text-white text-lg font-medium select-none truncate cursor-text"
                title="Дважды кликните, чтобы изменить"
              >
                  {task.title}
              </div>
          )}
          
          <div className="flex gap-3 mt-1 opacity-60">
            <span className={`text-xs ${PRIORITY_CONFIG[task.priority].color}`}>{PRIORITY_CONFIG[task.priority].label}</span>
            <span className={`text-xs ${EFFORT_CONFIG[task.effort].color}`}>{EFFORT_CONFIG[task.effort].label}</span>
          </div>
        </div>
      </div>
      
      <button 
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onDelete(); }} 
        className="text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-2"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};