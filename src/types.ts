import type { LucideIcon } from 'lucide-react';

export type Priority = 'high' | 'normal' | 'low';
export type Effort = 'quick' | 'medium' | 'long';

// НОВОЕ: Типы для интеллектуальных фич
export interface ProductivityHealth {
  score: number; // 0-100
  level: 'excellent' | 'good' | 'warning' | 'critical';
  factors: HealthFactor[];
  recommendations: Recommendation[];
  trends: HealthTrend;
}

export interface HealthFactor {
  name: string;
  score: number; // 0-100
  weight: number; // влияние на общий скор
  status: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface Recommendation {
  id: string;
  type: 'break' | 'planning' | 'task_management' | 'schedule';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  action: string;
}

export interface HealthTrend {
  direction: 'improving' | 'stable' | 'declining';
  change: number; // изменение за период
  period: 'week' | 'month';
  prediction: {
    nextWeek: number;
    confidence: number; // 0-1
  };
}

/** Union type for history entry data based on action type */
export type HistoryData =
  | { title: string; priority: Priority; effort: Effort; clientIds?: number[] } // legacy task_create
  | Task // full task for restore
  | Client // full client for restore
  | { id: number; name: string; priority: Priority } // legacy client
  | { previousValue?: unknown; newValue?: unknown } // updates
  | Record<string, unknown>; // fallback

export interface HistoryEntry {
  id: number;
  timestamp: number;
  type: 'task_create' | 'task_complete' | 'task_delete' | 'task_update' | 'client_add' | 'client_remove' | 'client_update';
  data: HistoryData;
  description: string;
  userId: string;
  clientId?: number | string; // Разрешил строки
  taskId?: number | string;   // Разрешил строки
}

export interface TimePrediction {
  projectId: number;
  totalEstimatedHours: number;
  confidence: number; // 0-1
  breakdown: TaskTypePrediction[];
  milestones: MilestonePrediction[];
  riskFactors: RiskFactor[];
  optimalSchedule: OptimalSchedule[];
}

export interface TaskTypePrediction {
  priority: Priority;
  effort: Effort;
  count: number;
  avgHoursPerTask: number;
  totalHours: number;
  confidence: number;
}

export interface MilestonePrediction {
  name: string;
  estimatedDate: number;
  tasksCompleted: number;
  totalTasks: number;
  confidence: number;
}

export interface RiskFactor {
  type: 'overdue' | 'complexity' | 'capacity' | 'dependencies';
  description: string;
  impact: 'low' | 'medium' | 'high';
  probability: number; // 0-1
  mitigation: string;
}

export interface OptimalSchedule {
  dayOfWeek: number; // 0-6, 0 = воскресенье
  hour: number; // 0-23
  recommendedTasks: number;
  focusScore: number; // 0-100
}

export interface FocusSession {
  id: number | string;       // Разрешил строки
  clientId: number | string; // Разрешил строки
  taskId?: number | string;  // Разрешил строки
  startTime: number;
  endTime?: number;
  duration: number; // в секундах
  wasCompleted: boolean;
}

export interface TaskStats {
  total: number;
  completed: number;
  avgCompletionTime: number; // в часах
  completionRate: number; // процент
  byPriority: Record<Priority, number>;
  byEffort: Record<Effort, number>;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  tasksCompleted: number;
  pointsEarned: number;
  focusTime: number; // в минутах
  sessionsCount: number;
}

export interface ProjectStats {
  clientId: number;
  clientName: string;
  totalTasks: number;
  completedTasks: number;
  burndownData: BurndownPoint[];
  priorityDistribution: PriorityDistribution[];
  avgTaskSpeed: number; // часы на задачу
}

export interface BurndownPoint {
  date: string; // YYYY-MM-DD
  ideal: number; // идеальное количество оставшихся задач
  actual: number; // фактическое количество оставшихся задач
  targetDate?: string; // целевая дата завершения
}

export interface PriorityDistribution {
  priority: Priority;
  count: number;
  percentage: number;
  avgTimeSpent: number; // в часах
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  unlockedAt?: number;
  progress: number;
  target: number;
  category: 'tasks' | 'streak' | 'time' | 'special';
}

export interface Comment {
  id: number;
  text: string;
  createdAt: number;
  author: string;
}

export interface Task {
  id: number;
  title: string;
  isDone: boolean;
  priority: Priority;
  effort: Effort;
  createdAt: number;
  completedAt?: number;
  dueDate?: number;
  comments: Comment[];
  pointsEarned?: number;
  timeSpent?: number; // НОВОЕ: фактически затраченное время в минутах
  predictedTime?: number; // НОВОЕ: предсказанное время в минутах
}

export interface NoteItem {
  id: number;
  content: string;
  createdAt: number;
  isPinned?: boolean;
}

export interface DmcaProfile {
  legalName: string;
  address: string;
  email: string;
  phone: string; // НОВОЕ
  contentSourceUrl?: string;
}

export interface Client {
  id: number;
  name: string;
  priority: Priority;
  notes: NoteItem[];
  accounts: NoteItem[];
  dmcaProfile?: DmcaProfile; // НОВОЕ: Профиль для DMCA
  tasks: Task[];
  createdAt: number;
  targetCompletionDate?: number; // НОВОЕ: целевая дата завершения проекта
}

export interface AppSettings {
  soundEnabled: boolean;
  groqApiKey?: string;
  dmcaSites?: string[]; // НОВОЕ: список сайтов для DMCA
}

export interface UserProgress {
  totalPoints: number;
  level: number;
  currentLevelPoints: number;
  nextLevelPoints: number;
  achievements: Achievement[];
  stats: UserStats;
  focusSessions: FocusSession[];
  productivityHealth: ProductivityHealth; // НОВОЕ
  history: HistoryEntry[]; // НОВОЕ
  timePredictions: TimePrediction[]; // НОВОЕ
}

export interface UserStats {
  totalTasksCompleted: number;
  currentStreak: number;
  maxStreak: number;
  totalFocusTime: number; // в минутах
  tasksThisWeek: number;
  tasksThisMonth: number;
  perfectDays: number;
  averageTasksPerDay: number;
  bestDay: { date: string; tasks: number };
  consistencyScore: number;
  avgSessionDuration: number; // НОВОЕ
  peakPerformanceHours: number[]; // НОВОЕ
}