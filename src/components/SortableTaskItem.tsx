import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, GripVertical, Pencil, X, Check, Calendar, MessageCircle, Clock } from 'lucide-react';
import { PRIORITY_CONFIG, EFFORT_CONFIG } from '../constants';
import { DateUtils } from '../utils';
import type { Task, Priority, Effort, Comment } from '../types';

interface SortableTaskItemProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onUpdateTitle: (newTitle: string) => void;
  onUpdatePriority: (priority: Priority) => void;
  onUpdateEffort: (effort: Effort) => void;
  onUpdateDueDate: (dueDate?: number) => void;
  onAddComment: (text: string) => void;
  onOpenComments: () => void;
}

export const SortableTaskItem = React.memo<SortableTaskItemProps>(({
  task, onToggle, onDelete, onUpdateTitle, onUpdatePriority, onUpdateEffort,
  onUpdateDueDate, onAddComment, onOpenComments
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
      onUpdateTitle(editTitle.trim());
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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const timestamp = new Date(value).getTime();
      onUpdateDueDate(timestamp);
    } else {
      onUpdateDueDate(undefined);
    }
  };

  // Определяем статус даты для индикатора
  const getDateStatus = () => {
    if (!task.dueDate) return null;
    if (DateUtils.isOverdue(task.dueDate) && !task.isDone) return 'overdue';
    if (DateUtils.isToday(task.dueDate)) return 'today';
    if (DateUtils.isTomorrow(task.dueDate)) return 'tomorrow';
    if (DateUtils.isUpcoming(task.dueDate)) return 'upcoming';
    return 'future';
  };

  const dateStatus = getDateStatus();
  const dateDisplay = DateUtils.formatDueDate(task.dueDate);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
            bg-surface p-4 rounded-2xl flex items-center justify-between group 
            border transition-all duration-200
            ${isDragging ? 'border-primary/50 bg-surface/90' : 'border-white/5 hover:border-white/10'}
            ${task.isDone ? 'opacity-50' : ''}
            ${dateStatus === 'overdue' ? 'border-error/30 bg-error/5' : ''}
            ${dateStatus === 'today' ? 'border-warning/30 bg-warning/5' : ''}
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
        <motion.button
          onClick={onToggle}
          className="relative w-7 h-7 shrink-0 flex items-center justify-center"
          whileTap={{ scale: 0.9 }}
        >
          {/* Background circle */}
          <svg className="absolute w-7 h-7" viewBox="0 0 28 28">
            <circle
              cx="14"
              cy="14"
              r="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-secondary/30"
            />
            {/* Animated progress ring */}
            <motion.circle
              cx="14"
              cy="14"
              r="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="text-success"
              strokeDasharray="75.4"
              initial={{ strokeDashoffset: task.isDone ? 0 : 75.4 }}
              animate={{ strokeDashoffset: task.isDone ? 0 : 75.4 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
            />
          </svg>
          {/* Check icon */}
          <motion.div
            initial={{ scale: task.isDone ? 1 : 0, opacity: task.isDone ? 1 : 0 }}
            animate={{ scale: task.isDone ? 1 : 0, opacity: task.isDone ? 1 : 0 }}
            transition={{ duration: 0.2, delay: task.isDone ? 0.2 : 0 }}
          >
            <Check size={14} className="text-success stroke-[3]" />
          </motion.div>
        </motion.button>

        <div className="flex-1 min-w-0 mr-2">
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <input
                ref={inputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="bg-bg/50 text-white px-3 py-1.5 rounded-lg w-full outline-none border border-primary/50 text-lg shadow-inner"
              />

              <div className="flex items-center gap-3 mt-1" onMouseDown={(e) => e.preventDefault()}>
                <div className="flex bg-bg/30 rounded-lg p-0.5 gap-0.5">
                  {(['high', 'normal', 'low'] as Priority[]).map(p => (
                    <button
                      key={p}
                      onClick={() => onUpdatePriority(p)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${task.priority === p
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
                        className={`p-1 rounded transition-all flex items-center gap-1 ${task.effort === e
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

                <div className="w-px h-4 bg-white/10"></div>

                <input
                  type="date"
                  onChange={handleDateChange}
                  value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                  className="bg-bg/30 text-white text-xs px-2 py-1 rounded border border-white/10 focus:border-primary/50 outline-none"
                  title="Дата выполнения"
                />
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
            <div className="flex gap-3 mt-1.5 opacity-60 items-center flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded bg-white/5 border border-white/5 ${PRIORITY_CONFIG[task.priority].color}`}>
                {PRIORITY_CONFIG[task.priority].label}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded bg-white/5 border border-white/5 ${EFFORT_CONFIG[task.effort].color}`}>
                {EFFORT_CONFIG[task.effort].label}
              </span>

              {/* НОВЫЙ: Индикатор даты */}
              {task.dueDate && (
                <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${dateStatus === 'overdue' ? 'bg-error/20 text-error border-error/30' :
                  dateStatus === 'today' ? 'bg-warning/20 text-warning border-warning/30' :
                    dateStatus === 'tomorrow' ? 'bg-success/20 text-success border-success/30' :
                      'bg-white/5 text-secondary border-white/10'
                  }`}>
                  <Calendar size={10} />
                  {dateDisplay}
                </div>
              )}

              {/* НОВЫЙ: Комментарии */}
              {task.comments.length > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenComments(); }}
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  <MessageCircle size={10} />
                  {task.comments.length}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={`flex items-center gap-1 transition-opacity ${isDragging ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
        {isEditing ? (
          <>
            <button onMouseDown={handleSave} className="p-2 text-success hover:bg-success/10 rounded-lg transition-colors"><Check size={18} /></button>
            <button onMouseDown={handleCancel} className="p-2 text-secondary hover:text-white hover:bg-white/10 rounded-lg transition-colors"><X size={18} /></button>
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
}, (prevProps, nextProps) => {
  // Custom comparison for React.memo - only re-render when task data actually changes
  const prevTask = prevProps.task;
  const nextTask = nextProps.task;

  return (
    prevTask.id === nextTask.id &&
    prevTask.isDone === nextTask.isDone &&
    prevTask.title === nextTask.title &&
    prevTask.priority === nextTask.priority &&
    prevTask.effort === nextTask.effort &&
    prevTask.dueDate === nextTask.dueDate &&
    prevTask.comments.length === nextTask.comments.length
  );
});

SortableTaskItem.displayName = 'SortableTaskItem';