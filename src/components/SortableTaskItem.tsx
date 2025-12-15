import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, GripVertical, Pencil, X, Check } from 'lucide-react';

import { PRIORITY_CONFIG, EFFORT_CONFIG } from '../types';
import type { Task, Priority, Effort } from '../types';

interface SortableTaskItemProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onUpdateTitle: (newTitle: string) => void;
  onUpdatePriority: (priority: Priority) => void; // Новый проп
  onUpdateEffort: (effort: Effort) => void;       // Новый проп
}

export const SortableTaskItem: React.FC<SortableTaskItemProps> = ({ 
  task, onToggle, onDelete, onUpdateTitle, onUpdatePriority, onUpdateEffort 
}) => {
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
    opacity: isDragging ? 0.8 : 1,
    scale: isDragging ? 1.05 : 1,
    boxShadow: isDragging ? '0px 10px 20px rgba(0,0,0,0.5)' : 'none',
  };

  useEffect(() => {
      if (isEditing && inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
      }
  }, [isEditing]);

  const handleSave = () => {
      if (editTitle.trim()) {
          onUpdateTitle(editTitle);
      } else {
          setEditTitle(task.title);
      }
      setIsEditing(false);
  };

  const handleCancel = () => {
      setEditTitle(task.title);
      setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSave();
      if (e.key === 'Escape') handleCancel();
  };

  return (
    <div 
        ref={setNodeRef} 
        style={style} 
        className={`
            bg-surface p-4 rounded-2xl flex items-center justify-between group 
            border transition-all duration-200
            ${isDragging ? 'border-primary/50 bg-surface/90' : 'border-white/5 hover:border-white/10'}
            ${task.isDone ? 'opacity-50' : ''}
        `}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="mr-3 cursor-grab active:cursor-grabbing text-secondary/30 hover:text-secondary p-1 -ml-2 rounded-lg hover:bg-white/5 transition-colors"
      >
          <GripVertical size={20} />
      </div>

      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button 
          onClick={onToggle}
          className={`
            w-6 h-6 rounded-full border-2 transition-all shrink-0 flex items-center justify-center
            ${task.isDone 
                ? 'bg-success border-success' 
                : 'border-secondary/50 hover:border-success hover:bg-success/10'
            }
          `}
        >
            {task.isDone && <Check size={14} className="text-bg stroke-[3]" />}
        </button>

        <div className="flex-1 min-w-0 mr-2">
          {isEditing ? (
             <div className="flex flex-col gap-2">
                {/* Input для текста */}
                <input 
                    ref={inputRef}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleSave} 
                    onKeyDown={handleKeyDown}
                    className="bg-bg/50 text-white px-3 py-1.5 rounded-lg w-full outline-none border border-primary/50 text-lg shadow-inner"
                />
                
                {/* Кнопки редактирования приоритета и усилий */}
                <div className="flex items-center gap-3 mt-1" onMouseDown={(e) => e.preventDefault()}>
                     <div className="flex bg-bg/30 rounded-lg p-0.5 gap-0.5">
                        {(['high', 'normal', 'low'] as Priority[]).map(p => (
                            <button
                                key={p}
                                onClick={() => onUpdatePriority(p)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                                    task.priority === p 
                                    ? `${PRIORITY_CONFIG[p].bg} ${PRIORITY_CONFIG[p].color} shadow-sm` 
                                    : 'text-secondary hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {PRIORITY_CONFIG[p].label}
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-4 bg-white/10"></div>

                    <div className="flex bg-bg/30 rounded-lg p-0.5 gap-0.5">
                        {(['quick', 'medium', 'long'] as Effort[]).map(e => {
                            const Icon = EFFORT_CONFIG[e].icon;
                            return (
                                <button
                                    key={e}
                                    onClick={() => onUpdateEffort(e)}
                                    className={`p-1 rounded transition-all flex items-center gap-1 ${
                                        task.effort === e 
                                        ? 'bg-white/10 text-white shadow-sm' 
                                        : 'text-secondary hover:text-white hover:bg-white/5'
                                    }`}
                                    title={EFFORT_CONFIG[e].label}
                                >
                                    <Icon size={12} className={task.effort === e ? EFFORT_CONFIG[e].color : ''} />
                                </button>
                            );
                        })}
                    </div>
                </div>
             </div>
          ) : (
              <div 
                onDoubleClick={() => setIsEditing(true)}
                className={`text-lg font-medium select-none truncate cursor-text transition-colors ${task.isDone ? 'line-through text-secondary' : 'text-white'}`}
                title={task.title}
              >
                  {task.title}
              </div>
          )}
          
          {/* Мета-информация в режиме просмотра */}
          {!isEditing && (
              <div className="flex gap-3 mt-1.5 opacity-60">
                <span className={`text-xs px-2 py-0.5 rounded bg-white/5 border border-white/5 ${PRIORITY_CONFIG[task.priority].color}`}>
                    {PRIORITY_CONFIG[task.priority].label}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded bg-white/5 border border-white/5 ${EFFORT_CONFIG[task.effort].color}`}>
                    {EFFORT_CONFIG[task.effort].label}
                </span>
              </div>
          )}
        </div>
      </div>
      
      <div className={`flex items-center gap-1 transition-opacity ${isDragging ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
         {isEditing ? (
             <>
                <button onMouseDown={handleSave} className="p-2 text-success hover:bg-success/10 rounded-lg transition-colors"><Check size={18}/></button>
                <button onMouseDown={handleCancel} className="p-2 text-secondary hover:text-white hover:bg-white/10 rounded-lg transition-colors"><X size={18}/></button>
             </>
         ) : (
             <>
                <button 
                    onClick={() => setIsEditing(true)} 
                    className="p-2 text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Редактировать"
                >
                    <Pencil size={16} />
                </button>
                <button 
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                    className="p-2 text-secondary hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Удалить"
                >
                    <Trash2 size={18} />
                </button>
             </>
         )}
      </div>
    </div>
  );
};