import { Zap, Clock, Coffee } from 'lucide-react';

export type Priority = 'high' | 'normal' | 'low';
export type Effort = 'quick' | 'medium' | 'long';

export interface Task {
  id: number;
  title: string;
  isDone: boolean;
  priority: Priority;
  effort: Effort;
  createdAt: number;
  completedAt?: number;
}

export interface Client {
  id: number;
  name: string;
  priority: Priority;
  notes: string;
  tasks: Task[];
}

export interface AppSettings {
  soundEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
};

export const PRIORITY_CONFIG = {
  // ИСПРАВЛЕНИЕ: Добавлено поле indicator с явными классами фона
  high: { 
    label: 'Высокий', 
    color: 'text-error', 
    indicator: 'bg-error', // Явный класс
    border: 'border-error', 
    bg: 'bg-error/20', 
    weight: 3 
  },
  normal: { 
    label: 'Обычный', 
    color: 'text-primary', 
    indicator: 'bg-primary', // Явный класс
    border: 'border-primary', 
    bg: 'bg-primary/20', 
    weight: 2 
  },
  low: { 
    label: 'Низкий', 
    color: 'text-success', 
    indicator: 'bg-success', // Явный класс
    border: 'border-success', 
    bg: 'bg-success/20', 
    weight: 1 
  },
};

export const EFFORT_CONFIG = {
  quick: { label: '5 мин', icon: Zap, color: 'text-warning' },
  medium: { label: '30 мин', icon: Clock, color: 'text-primary' },
  long: { label: 'Долго', icon: Coffee, color: 'text-accent' },
};

export const DB_FILENAME = 'zen-db.json';