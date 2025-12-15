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
  high: { label: 'Важно', color: 'text-red-400', border: 'border-red-400', bg: 'bg-red-400/10', weight: 3 },
  normal: { label: 'Обычно', color: 'text-blue-400', border: 'border-blue-400', bg: 'bg-blue-400/10', weight: 2 },
  low: { label: 'Не горит', color: 'text-green-400', border: 'border-green-400', bg: 'bg-green-400/10', weight: 1 },
};

export const EFFORT_CONFIG = {
  quick: { label: '5 мин', icon: Zap, color: 'text-yellow-400' },
  medium: { label: '30 мин', icon: Clock, color: 'text-orange-400' },
  long: { label: 'Долго', icon: Coffee, color: 'text-purple-400' },
};

export const DB_FILENAME = 'zen-db.json';