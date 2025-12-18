import { Zap, Clock, Coffee, Trophy, Star, Target, Calendar, CheckCircle, TrendingUp, BarChart3, Activity, Heart, AlertTriangle, Brain, RotateCcw, RotateCw } from 'lucide-react';

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

export interface HistoryEntry {
  id: number;
  timestamp: number;
  // Добавил 'client_update'
  type: 'task_create' | 'task_complete' | 'task_delete' | 'task_update' | 'client_add' | 'client_remove' | 'client_update';
  data: any;
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
  icon: any;
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

export interface Client {
  id: number;
  name: string;
  priority: Priority;
  notes: string;
  tasks: Task[];
  createdAt: number;
  targetCompletionDate?: number; // НОВОЕ: целевая дата завершения проекта
}

export interface AppSettings {
  soundEnabled: boolean;
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

export const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
};

export const LEVELS = [
  { level: 1, name: 'Новичок', minPoints: 0, color: 'text-gray-400' },
  { level: 2, name: 'Ученик', minPoints: 100, color: 'text-blue-400' },
  { level: 3, name: 'Практик', minPoints: 300, color: 'text-green-400' },
  { level: 4, name: 'Мастер', minPoints: 600, color: 'text-yellow-400' },
  { level: 5, name: 'Легенда', minPoints: 1000, color: 'text-purple-400' },
  { level: 6, name: 'Гуру', minPoints: 1500, color: 'text-pink-400' },
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_task',
    name: 'Первая кровь',
    description: 'Выполните первую задачу',
    icon: CheckCircle,
    progress: 0,
    target: 1,
    category: 'tasks'
  },
  {
    id: 'task_master_10',
    name: 'Мастер задач',
    description: 'Выполните 10 задач',
    icon: Target,
    progress: 0,
    target: 10,
    category: 'tasks'
  },
  {
    id: 'task_master_50',
    name: 'Легенда задач',
    description: 'Выполните 50 задач',
    icon: Trophy,
    progress: 0,
    target: 50,
    category: 'tasks'
  },
  {
    id: 'task_master_100',
    name: 'Повелитель задач',
    description: 'Выполните 100 задач',
    icon: Star,
    progress: 0,
    target: 100,
    category: 'tasks'
  },
  {
    id: 'streak_3',
    name: 'Начало пути',
    description: '3 дня подряд без прокрастинации',
    icon: Calendar,
    progress: 0,
    target: 3,
    category: 'streak'
  },
  {
    id: 'streak_7',
    name: 'Неделя силы',
    description: '7 дней подряд',
    icon: Calendar,
    progress: 0,
    target: 7,
    category: 'streak'
  },
  {
    id: 'streak_30',
    name: 'Месяц мастера',
    description: '30 дней подряд',
    icon: Calendar,
    progress: 0,
    target: 30,
    category: 'streak'
  },
  {
    id: 'focus_60',
    name: 'Фокус-час',
    description: 'Наработайте 60 минут в фокусе',
    icon: Clock,
    progress: 0,
    target: 60,
    category: 'time'
  },
  {
    id: 'focus_300',
    name: 'Мастер фокуса',
    description: 'Наработайте 5 часов в фокусе',
    icon: Clock,
    progress: 0,
    target: 300,
    category: 'time'
  },
  {
    id: 'perfect_week',
    name: 'Идеальная неделя',
    description: 'Неделя без просроченных задач',
    icon: Star,
    progress: 0,
    target: 7,
    category: 'special'
  }
];

export const PRIORITY_CONFIG = {
  high: { 
    label: 'Высокий', 
    color: 'text-error', 
    indicator: 'bg-error',
    border: 'border-error', 
    bg: 'bg-error/20', 
    weight: 3,
    points: 30
  },
  normal: { 
    label: 'Обычный', 
    color: 'text-primary', 
    indicator: 'bg-primary',
    border: 'border-primary', 
    bg: 'bg-primary/20', 
    weight: 2,
    points: 20
  },
  low: { 
    label: 'Низкий', 
    color: 'text-success', 
    indicator: 'bg-success',
    border: 'border-success', 
    bg: 'bg-success/20', 
    weight: 1,
    points: 10
  },
};

export const EFFORT_CONFIG = {
  quick: { label: '5 мин', icon: Zap, color: 'text-warning' },
  medium: { label: '30 мин', icon: Clock, color: 'text-primary' },
  long: { label: 'Долго', icon: Coffee, color: 'text-accent' },
};

export const DB_FILENAME = 'zen-db.json';

// Константы для аналитики
export const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6', 
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  gray: '#6b7280'
};

export const ANALYTICS_CONFIG = {
  dateRange: {
    week: 7,
    month: 30,
    quarter: 90
  },
  focusSession: {
    minDuration: 5 * 60, // 5 минут в секундах
    maxDuration: 8 * 60 * 60 // 8 часов
  }
};

export const HEALTH_LEVELS = {
  excellent: { 
    min: 80, 
    color: 'text-green-400', 
    bg: 'bg-green-400/20', 
    icon: Heart,
    description: 'Отличное состояние'
  },
  good: { 
    min: 60, 
    color: 'text-blue-400', 
    bg: 'bg-blue-400/20', 
    icon: Activity,
    description: 'Хорошее состояние'
  },
  warning: { 
    min: 40, 
    color: 'text-yellow-400', 
    bg: 'bg-yellow-400/20', 
    icon: AlertTriangle,
    description: 'Требует внимания'
  },
  critical: { 
    min: 0, 
    color: 'text-red-400', 
    bg: 'bg-red-400/20', 
    icon: Brain,
    description: 'Критическое состояние'
  },
};

export const DateUtils = {
  isToday: (timestamp?: number) => {
    if (!timestamp) return false;
    const today = new Date();
    const due = new Date(timestamp);
    return today.toDateString() === due.toDateString();
  },
  
  isTomorrow: (timestamp?: number) => {
    if (!timestamp) return false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const due = new Date(timestamp);
    return tomorrow.toDateString() === due.toDateString();
  },
  
  isOverdue: (timestamp?: number) => {
    if (!timestamp) return false;
    const now = new Date();
    const due = new Date(timestamp);
    return now.getTime() > due.getTime();
  },
  
  isUpcoming: (timestamp?: number) => {
    if (!timestamp) return false;
    const now = new Date();
    const due = new Date(timestamp);
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    return due.getTime() > now.getTime() && due.getTime() <= oneWeekFromNow.getTime();
  },
  
  getDaysUntil: (timestamp?: number) => {
    if (!timestamp) return null;
    const now = new Date();
    const due = new Date(timestamp);
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },
  
  formatDueDate: (timestamp?: number) => {
    if (!timestamp) return null;
    const due = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Завтра';
    if (diffDays === -1) return 'Вчера';
    if (diffDays > 1 && diffDays <= 7) return `Через ${diffDays} дн.`;
    if (diffDays < -1) return `${Math.abs(diffDays)} дн. назад`;
    
    return due.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short' 
    });
  },
  
  isSameDay: (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  },
  
  startOfDay: (date: Date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  },
  
  formatDate: (timestamp: number) => {
    return new Date(timestamp).toISOString().split('T')[0];
  },
  
  getDateRange: (days: number) => {
    const dates = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  }
};

export const GamificationUtils = {
  getLevelByPoints: (points: number) => {
    let currentLevel = LEVELS[0];
    for (const level of LEVELS) {
      if (points >= level.minPoints) {
        currentLevel = level;
      } else {
        break;
      }
    }
    return currentLevel;
  },
  
  getNextLevelPoints: (currentLevel: number) => {
    const current = LEVELS.find(l => l.level === currentLevel);
    const next = LEVELS.find(l => l.level === currentLevel + 1);
    return next ? next.minPoints : current?.minPoints || 0;
  },
  
  getProgressToNextLevel: (points: number, currentLevel: number) => {
    const current = LEVELS.find(l => l.level === currentLevel);
    const next = LEVELS.find(l => l.level === currentLevel + 1);
    
    if (!current || !next) return { current: 0, next: 0, progress: 0 };
    
    const currentPoints = points - current.minPoints;
    const pointsNeeded = next.minPoints - current.minPoints;
    const progress = Math.min((currentPoints / pointsNeeded) * 100, 100);
    
    return {
      current: currentPoints,
      next: pointsNeeded,
      progress
    };
  },
  
  calculateTaskPoints: (priority: Priority, effort: Effort, completedOnTime?: boolean) => {
    let basePoints = PRIORITY_CONFIG[priority].points;
    
    if (effort === 'quick') basePoints += 5;
    if (completedOnTime) basePoints += 10;
    
    return basePoints;
  },
  
  checkAchievements: (stats: UserStats, achievements: Achievement[]) => {
    return achievements.map(achievement => {
      let progress = 0;
      
      switch (achievement.category) {
        case 'tasks':
          progress = stats.totalTasksCompleted;
          break;
        case 'streak':
          progress = stats.currentStreak;
          break;
        case 'time':
          progress = Math.floor(stats.totalFocusTime / 60);
          break;
        case 'special':
          progress = stats.perfectDays;
          break;
      }
      
      const isUnlocked = progress >= achievement.target;
      return {
        ...achievement,
        progress: Math.min(progress, achievement.target),
        unlockedAt: isUnlocked && !achievement.unlockedAt ? Date.now() : achievement.unlockedAt
      };
    });
  }
};

// Утилиты для аналитики
export const AnalyticsUtils = {
  calculateTaskStats: (tasks: Task[]): TaskStats => {
    const completedTasks = tasks.filter(t => t.isDone);
    const total = tasks.length;
    const completed = completedTasks.length;
    
    let avgCompletionTime = 0;
    if (completedTasks.length > 0) {
      const totalTime = completedTasks.reduce((acc, task) => {
        if (task.completedAt) {
          return acc + (task.completedAt - task.createdAt);
        }
        return acc;
      }, 0);
      avgCompletionTime = totalTime / completedTasks.length / (1000 * 60 * 60); // в часах
    }
    
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    
    const byPriority = {
      high: tasks.filter(t => t.priority === 'high' && t.isDone).length,
      normal: tasks.filter(t => t.priority === 'normal' && t.isDone).length,
      low: tasks.filter(t => t.priority === 'low' && t.isDone).length,
    };
    
    const byEffort = {
      quick: tasks.filter(t => t.effort === 'quick' && t.isDone).length,
      medium: tasks.filter(t => t.effort === 'medium' && t.isDone).length,
      long: tasks.filter(t => t.effort === 'long' && t.isDone).length,
    };
    
    return {
      total,
      completed,
      avgCompletionTime,
      completionRate,
      byPriority,
      byEffort
    };
  },
  
  calculateDailyStats: (clients: Client[], focusSessions: FocusSession[], dateRange: string[]): DailyStats[] => {
    return dateRange.map(date => {
      const dayStart = new Date(date + 'T00:00:00').getTime();
      const dayEnd = new Date(date + 'T23:59:59').getTime();
      
      let tasksCompleted = 0;
      let pointsEarned = 0;
      
      clients.forEach(client => {
        client.tasks.forEach(task => {
          if (task.isDone && task.completedAt && task.completedAt >= dayStart && task.completedAt <= dayEnd) {
            tasksCompleted++;
            pointsEarned += task.pointsEarned || 0;
          }
        });
      });
      
      const sessionsForDay = focusSessions.filter(session => 
        session.startTime >= dayStart && session.startTime <= dayEnd
      );
      
      const focusTime = sessionsForDay.reduce((acc, session) => acc + session.duration, 0) / 60; // в минутах
      
      return {
        date,
        tasksCompleted,
        pointsEarned,
        focusTime,
        sessionsCount: sessionsForDay.length
      };
    });
  },
  
  calculateProjectStats: (clients: Client[]): ProjectStats[] => {
    return clients.map(client => {
      const tasks = client.tasks;
      const completedTasks = tasks.filter(t => t.isDone);
      const totalTasks = tasks.length;
      const totalCompleted = completedTasks.length;
      
      const burndownData: BurndownPoint[] = [];
      const completedDates = completedTasks
        .filter(t => t.completedAt)
        .map(t => DateUtils.formatDate(t.completedAt!))
        .sort();
      
      const allDates = Array.from(new Set([
        ...DateUtils.getDateRange(30),
        ...completedDates
      ])).sort();
      
      let remainingTasks = totalTasks;
      const dailyCompleted = completedDates.reduce((acc, date) => {
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      allDates.forEach(date => {
        const idealRemaining = Math.max(0, totalTasks - Math.floor((allDates.indexOf(date) / allDates.length) * totalTasks));
        const actualRemaining = Math.max(0, remainingTasks - (dailyCompleted[date] || 0));
        
        if (totalTasks > 0) {
          burndownData.push({
            date,
            ideal: idealRemaining,
            actual: actualRemaining
          });
          
          if (dailyCompleted[date]) {
            remainingTasks -= dailyCompleted[date];
          }
        }
      });
      
      const priorityCounts = {
        high: tasks.filter(t => t.priority === 'high').length,
        normal: tasks.filter(t => t.priority === 'normal').length,
        low: tasks.filter(t => t.priority === 'low').length,
      };
      
      const priorityDistribution: PriorityDistribution[] = Object.entries(priorityCounts).map(([priority, count]) => {
        const tasksOfPriority = tasks.filter(t => t.priority === priority);
        const completedOfPriority = tasksOfPriority.filter(t => t.isDone);
        
        let avgTimeSpent = 0;
        if (completedOfPriority.length > 0) {
          const totalTime = completedOfPriority.reduce((acc, task) => {
            if (task.completedAt) {
              return acc + (task.completedAt - task.createdAt);
            }
            return acc;
          }, 0);
          avgTimeSpent = totalTime / completedOfPriority.length / (1000 * 60 * 60); // в часах
        }
        
        return {
          priority: priority as Priority,
          count,
          percentage: totalTasks > 0 ? (count / totalTasks) * 100 : 0,
          avgTimeSpent
        };
      });
      
      const avgTaskSpeed = completedTasks.length > 0 
        ? completedTasks.reduce((acc, task) => {
            if (task.completedAt) {
              return acc + (task.completedAt - task.createdAt);
            }
            return acc;
          }, 0) / completedTasks.length / (1000 * 60 * 60)
        : 0;
      
      return {
        clientId: client.id,
        clientName: client.name,
        totalTasks,
        completedTasks: totalCompleted,
        burndownData,
        priorityDistribution,
        avgTaskSpeed
      };
    });
  }
};

// НОВОЕ: Интеллектуальные утилиты
export const IntelligenceUtils = {
  calculateProductivityHealth: (clients: Client[], focusSessions: FocusSession[], stats: UserStats): ProductivityHealth => {
    const factors: HealthFactor[] = [];
    const recommendations: Recommendation[] = [];
    
    // Фактор 1: Консистентность
    const consistencyScore = Math.min(100, stats.consistencyScore);
    factors.push({
      name: 'Консистентность',
      score: consistencyScore,
      weight: 0.3,
      status: consistencyScore >= 70 ? 'positive' : consistencyScore >= 40 ? 'neutral' : 'negative',
      description: `${Math.round(consistencyScore)}% выполнения планов`
    });
    
    // Фактор 2: Баланс работы и отдыха
    const avgSessionDuration = stats.avgSessionDuration || 0;
    let balanceScore = 100;
    if (avgSessionDuration > 120) balanceScore = Math.max(0, 100 - ((avgSessionDuration - 120) / 60) * 20); // Слишком долгие сессии
    if (avgSessionDuration < 25) balanceScore = Math.max(0, balanceScore - ((25 - avgSessionDuration) / 5) * 15); // Слишком короткие
    
    factors.push({
      name: 'Баланс работы',
      score: balanceScore,
      weight: 0.25,
      status: balanceScore >= 70 ? 'positive' : balanceScore >= 40 ? 'neutral' : 'negative',
      description: `Средняя сессия: ${Math.round(avgSessionDuration)} мин`
    });
    
    // Фактор 3: Отношение к просроченным задачам
    const allTasks = clients.flatMap(c => c.tasks);
    const overdueTasks = allTasks.filter(t => t.isDone && t.dueDate && t.completedAt && t.completedAt > t.dueDate);
    const totalCompletedTasks = allTasks.filter(t => t.isDone);
    const overdueRatio = totalCompletedTasks.length > 0 ? (overdueTasks.length / totalCompletedTasks.length) * 100 : 0;
    const deadlineScore = Math.max(0, 100 - overdueRatio * 2);
    
    factors.push({
      name: 'Соблюдение сроков',
      score: deadlineScore,
      weight: 0.25,
      status: deadlineScore >= 80 ? 'positive' : deadlineScore >= 50 ? 'neutral' : 'negative',
      description: `${overdueTasks.length} просрочено из ${totalCompletedTasks.length}`
    });
    
    // Фактор 4: Регулярность фокуса
    const sessionCountThisWeek = focusSessions.filter(session => {
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      return session.startTime > weekAgo;
    }).length;
    const regularityScore = Math.min(100, (sessionCountThisWeek / 14) * 100); // Норма: 2 сессии в день
    
    factors.push({
      name: 'Регулярность фокуса',
      score: regularityScore,
      weight: 0.2,
      status: regularityScore >= 60 ? 'positive' : regularityScore >= 30 ? 'neutral' : 'negative',
      description: `${sessionCountThisWeek} сессий за неделю`
    });
    
    // Рассчитываем общий балл
    const totalScore = factors.reduce((acc, factor) => acc + (factor.score * factor.weight), 0);
    
    // Определяем уровень
    let level: 'excellent' | 'good' | 'warning' | 'critical';
    if (totalScore >= 80) level = 'excellent';
    else if (totalScore >= 60) level = 'good';
    else if (totalScore >= 40) level = 'warning';
    else level = 'critical';
    
    // Генерируем рекомендации
    if (level === 'critical' || level === 'warning') {
      if (balanceScore < 50) {
        recommendations.push({
          id: 'take_break',
          type: 'break',
          priority: 'high',
          title: 'Сделайте перерыв',
          description: 'Вы работаете слишком долго без отдыха',
          action: 'Рекомендуем делать перерыв каждые 90 минут'
        });
      }
      if (consistencyScore < 50) {
        recommendations.push({
          id: 'plan_better',
          type: 'planning',
          priority: 'medium',
          title: 'Улучшите планирование',
          description: 'Низкая консистентность выполнения планов',
          action: 'Попробуйте разбивать крупные задачи на smaller части'
        });
      }
    }
    
    const trends: HealthTrend = {
      direction: stats.consistencyScore > (stats.consistencyScore * 0.9) ? 'improving' : 'stable',
      change: stats.consistencyScore,
      period: 'week',
      prediction: {
        nextWeek: Math.min(100, totalScore + (Math.random() * 20 - 10)),
        confidence: 0.7
      }
    };
    
    return {
      score: Math.round(totalScore),
      level,
      factors,
      recommendations,
      trends
    };
  },
  
  predictProjectTime: (client: Client, focusSessions: FocusSession[]): TimePrediction => {
    const tasks = client.tasks.filter(t => !t.isDone);
    const completedTasks = client.tasks.filter(t => t.isDone);
    
    // Собираем фокус-сессии для этого проекта
    const projectSessions = focusSessions.filter(s => s.clientId === client.id);
    
    // Рассчитываем среднее время на основе завершенных задач
    const avgHoursPerTaskType: Record<string, number> = {};
    completedTasks.forEach(task => {
      // Приводим ID к строке для сравнения, так как в типах мы теперь разрешили и строки и числа
      const sessions = projectSessions.filter(s => String(s.taskId) === String(task.id));
      const totalHours = sessions.reduce((acc, s) => acc + (s.duration / 3600), 0);
      const key = `${task.priority}-${task.effort}`;
      avgHoursPerTaskType[key] = totalHours;
    });
    
    // Предикция по типам задач
    const breakdown: TaskTypePrediction[] = [];
    const priorityOrder: Priority[] = ['high', 'normal', 'low'];
    const effortOrder: Effort[] = ['quick', 'medium', 'long'];
    
    priorityOrder.forEach(priority => {
      effortOrder.forEach(effort => {
        const tasksOfType = tasks.filter(t => t.priority === priority && t.effort === effort);
        if (tasksOfType.length > 0) {
          const key = `${priority}-${effort}`;
          const avgHours = avgHoursPerTaskType[key] || effort === 'quick' ? 0.5 : effort === 'medium' ? 2 : 8;
          const confidence = completedTasks.length > 10 ? 0.8 : completedTasks.length > 5 ? 0.6 : 0.4;
          
          breakdown.push({
            priority,
            effort,
            count: tasksOfType.length,
            avgHoursPerTask: avgHours,
            totalHours: avgHours * tasksOfType.length,
            confidence
          });
        }
      });
    });
    
    const totalEstimatedHours = breakdown.reduce((acc, item) => acc + item.totalHours, 0);
    const overallConfidence = breakdown.length > 0 ? 
      breakdown.reduce((acc, item) => acc + item.confidence, 0) / breakdown.length : 0.5;
    
    // Предсказание вех
    const milestones: MilestonePrediction[] = [];
    const totalTasks = tasks.length;
    
    if (totalTasks > 0) {
      const milestone1 = Math.ceil(totalTasks * 0.25);
      const milestone2 = Math.ceil(totalTasks * 0.5);
      const milestone3 = Math.ceil(totalTasks * 0.75);
      
      const estimatedCompletionDate = client.targetCompletionDate || Date.now() + (totalEstimatedHours * 60 * 60 * 1000); // в миллисекундах
      
      milestones.push(
        {
          name: 'Четверть проекта',
          estimatedDate: Date.now() + (totalEstimatedHours * 0.25 * 60 * 60 * 1000),
          tasksCompleted: milestone1,
          totalTasks,
          confidence: overallConfidence * 0.9
        },
        {
          name: 'Половина проекта',
          estimatedDate: Date.now() + (totalEstimatedHours * 0.5 * 60 * 60 * 1000),
          tasksCompleted: milestone2,
          totalTasks,
          confidence: overallConfidence * 0.8
        },
        {
          name: 'Завершение',
          estimatedDate: estimatedCompletionDate,
          tasksCompleted: totalTasks,
          totalTasks,
          confidence: overallConfidence * 0.7
        }
      );
    }
    
    // Факторы риска
    const riskFactors: RiskFactor[] = [];
    
    const highPriorityTasks = tasks.filter(t => t.priority === 'high').length;
    if (highPriorityTasks > totalTasks * 0.3) {
      riskFactors.push({
        type: 'complexity',
        description: `Высокий процент высокоприоритетных задач (${Math.round((highPriorityTasks / totalTasks) * 100)}%)`,
        impact: 'high',
        probability: 0.7,
        mitigation: 'Пересмотрите приоритеты или увеличьте временные ресурсы'
      });
    }
    
    if (totalEstimatedHours > 40) {
      riskFactors.push({
        type: 'capacity',
        description: `Большой объем работы (${Math.round(totalEstimatedHours)} часов)`,
        impact: 'medium',
        probability: 0.5,
        mitigation: 'Рассмотрите возможность разделения проекта на этапы'
      });
    }
    
    // Оптимальное расписание
    const optimalSchedule: OptimalSchedule[] = [];
    const hourPerformance = new Array(24).fill(0);
    
    projectSessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      hourPerformance[hour] += session.wasCompleted ? 1 : 0.5;
    });
    
    // Находим топ-3 часа производительности
    const topHours = hourPerformance
      .map((score, hour) => ({ hour, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    
    topHours.forEach(({ hour, score }) => {
      optimalSchedule.push({
        dayOfWeek: 1, // Понедельник
        hour,
        recommendedTasks: Math.max(1, Math.round(8 / totalEstimatedHours)),
        focusScore: Math.min(100, (score / Math.max(1, projectSessions.length)) * 100)
      });
    });
    
    return {
      projectId: client.id,
      totalEstimatedHours,
      confidence: overallConfidence,
      breakdown,
      milestones,
      riskFactors,
      optimalSchedule
    };
  }
};