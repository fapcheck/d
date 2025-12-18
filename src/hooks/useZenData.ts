import { useState, useEffect, useRef, useCallback } from 'react';
import { BaseDirectory, readTextFile, writeTextFile, exists } from '@tauri-apps/plugin-fs';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { arrayMove } from '@dnd-kit/sortable';
import { 
  DEFAULT_SETTINGS, DB_FILENAME, GamificationUtils, ACHIEVEMENTS, DateUtils
} from '../types';
import type { 
  Client, Task, Priority, Effort, AppSettings, Comment, UserProgress, Achievement, UserStats, 
  FocusSession, HistoryEntry
} from '../types';

type RawClient = unknown;

const isRawClient = (v: RawClient): v is Client => {
  if (typeof v !== 'object' || v === null) return false;
  const c = v as any;
  return (
    typeof c.id === 'number' &&
    typeof c.name === 'string' &&
    (c.priority === 'high' || c.priority === 'normal' || c.priority === 'low') &&
    typeof c.notes === 'string' &&
    Array.isArray(c.tasks)
  );
};

const isRawTask = (t: any): t is Task => {
  return (
    typeof t?.id === 'number' &&
    typeof t?.title === 'string' &&
    typeof t?.isDone === 'boolean' &&
    (t?.priority === 'high' || t?.priority === 'normal' || t?.priority === 'low') &&
    (t?.effort === 'quick' || t?.effort === 'medium' || t?.effort === 'long') &&
    typeof t?.createdAt === 'number' &&
    Array.isArray(t?.comments)
  );
};

const isRawComment = (c: any): c is Comment => {
  return (
    typeof c?.id === 'number' &&
    typeof c?.text === 'string' &&
    typeof c?.createdAt === 'number' &&
    typeof c?.author === 'string'
  );
};

const normalizeClient = (v: RawClient): Client | null => {
  if (!isRawClient(v)) return null;
  const c = v as any;
  const tasks = Array.isArray(c.tasks) ? c.tasks.filter(isRawTask).map((t: any) => {
    const comments = Array.isArray(t.comments) ? t.comments.filter(isRawComment).map((cm: any) => ({ ...cm })) : [];
    return { 
      ...t, 
      comments,
      dueDate: t.dueDate || undefined,
      pointsEarned: t.pointsEarned || 0,
      timeSpent: t.timeSpent || 0,
      predictedTime: t.predictedTime || 0
    };
  }) : [];
  return { 
    id: c.id, 
    name: c.name, 
    priority: c.priority, 
    notes: c.notes ?? '', 
    tasks,
    createdAt: c.createdAt || Date.now(),
    targetCompletionDate: c.targetCompletionDate || undefined
  };
};

const writeSafe = async (path: string, data: string) => {
  try {
    await writeTextFile(path, data, { baseDir: BaseDirectory.AppLocalData });
    return true;
  } catch {
    try {
      localStorage.setItem(path, data);
      return true;
    } catch {
      return false;
    }
  }
};

const calculateUserStats = (clients: Client[], focusSessions: FocusSession[]): UserStats => {
  let totalTasksCompleted = 0;
  let tasksByDate: { [date: string]: number } = {};
  let perfectDays = 0;

  const now = new Date();
  const today = DateUtils.startOfDay(now);

  clients.forEach(client => {
    client.tasks.forEach(task => {
      if (task.isDone && task.completedAt) {
        totalTasksCompleted++;
        
        const completedDate = new Date(task.completedAt);
        const dateKey = DateUtils.startOfDay(completedDate).toISOString().split('T')[0];
        tasksByDate[dateKey] = (tasksByDate[dateKey] || 0) + 1;

        if (!task.dueDate || task.completedAt <= task.dueDate) {
          const perfectKey = `${dateKey}_perfect`;
          tasksByDate[perfectKey] = (tasksByDate[perfectKey] || 0) + 1;
        }
      }
    });
  });

  let currentStreak = 0;
  let maxStreak = 0;
  const dates = Object.keys(tasksByDate).filter(key => !key.endsWith('_perfect')).sort().reverse();
  for (let i = 0; i < dates.length; i++) {
    const date = new Date(dates[i]);
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    
    if (DateUtils.isSameDay(date, expectedDate)) {
      currentStreak++;
    } else {
      break;
    }
  }
  maxStreak = currentStreak;

  Object.keys(tasksByDate).forEach(dateKey => {
    if (dateKey.endsWith('_perfect')) {
      const actualDate = dateKey.replace('_perfect', '');
      const tasksCompleted = tasksByDate[actualDate] || 0;
      if (tasksCompleted > 0) {
        const tasksOnTime = tasksByDate[dateKey] || 0;
        if (tasksCompleted === tasksOnTime) {
          perfectDays++;
        }
      }
    }
  });

  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  let tasksThisWeek = 0;
  let tasksThisMonth = 0;
  Object.keys(tasksByDate).forEach(dateKey => {
    if (dateKey.endsWith('_perfect')) return;
    
    const date = new Date(dateKey);
    if (date >= oneWeekAgo) tasksThisWeek += tasksByDate[dateKey];
    if (date >= oneMonthAgo) tasksThisMonth += tasksByDate[dateKey];
  });

  const uniqueDates = Object.keys(tasksByDate).filter(key => !key.endsWith('_perfect'));
  const averageTasksPerDay = uniqueDates.length > 0 
    ? Math.round((totalTasksCompleted / uniqueDates.length) * 10) / 10
    : 0;

  let bestDay = { date: '', tasks: 0 };
  uniqueDates.forEach(date => {
    const tasksCount = tasksByDate[date];
    if (tasksCount > bestDay.tasks) {
      bestDay = { date, tasks: tasksCount };
    }
  });

  const consistencyScore = uniqueDates.length > 0 
    ? Math.min(100, Math.round((currentStreak / Math.max(1, uniqueDates.length)) * 100))
    : 0;

  const completedSessions = focusSessions.filter(s => s.endTime && s.wasCompleted);
  const avgSessionDuration = completedSessions.length > 0 
    ? completedSessions.reduce((acc, s) => acc + s.duration, 0) / completedSessions.length / 60 
    : 0;

  const hourPerformance = new Array(24).fill(0);
  completedSessions.forEach(session => {
    const hour = new Date(session.startTime).getHours();
    hourPerformance[hour] += 1;
  });

  const peakPerformanceHours = hourPerformance
    .map((count, hour) => ({ hour, count }))
    .filter(h => h.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(h => h.hour);

  return {
    totalTasksCompleted,
    currentStreak,
    maxStreak,
    totalFocusTime: focusSessions.reduce((acc, s) => acc + s.duration, 0) / 60,
    tasksThisWeek,
    tasksThisMonth,
    perfectDays,
    averageTasksPerDay,
    bestDay,
    consistencyScore,
    avgSessionDuration,
    peakPerformanceHours
  };
};

export function useZenData() {
  const [clients, setClients] = useState<Client[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [userProgress, setUserProgress] = useState<UserProgress>({
    totalPoints: 0,
    level: 1,
    currentLevelPoints: 0,
    nextLevelPoints: 100,
    achievements: ACHIEVEMENTS,
    stats: {
      totalTasksCompleted: 0,
      currentStreak: 0,
      maxStreak: 0,
      totalFocusTime: 0,
      tasksThisWeek: 0,
      tasksThisMonth: 0,
      perfectDays: 0,
      averageTasksPerDay: 0,
      bestDay: { date: '', tasks: 0 },
      consistencyScore: 0,
      avgSessionDuration: 0,
      peakPerformanceHours: []
    },
    focusSessions: [],
    productivityHealth: {
      score: 50,
      level: 'good',
      factors: [],
      recommendations: [],
      trends: {
        direction: 'stable',
        change: 0,
        period: 'week',
        prediction: {
          nextWeek: 50,
          confidence: 0.5
        }
      }
    },
    history: [],
    timePredictions: []
  });

  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = useCallback(() => {
    if (!settings.soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (!ctx) return;
      
      if (ctx.state === 'suspended') ctx.resume();

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (e) { console.error("Audio error", e); }
  }, [settings.soundEnabled]);

  const playAchievementSound = useCallback(() => {
    if (!settings.soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (!ctx) return;
      
      if (ctx.state === 'suspended') ctx.resume();

      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, index) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        oscillator.start(ctx.currentTime + index * 0.1);
        oscillator.stop(ctx.currentTime + index * 0.1 + 0.3);
      });
    } catch (e) { console.error("Achievement sound error", e); }
  }, [settings.soundEnabled]);

  const sendSystemNotification = useCallback(async (title: string) => {
    try {
      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
      }
      if (permissionGranted) {
        sendNotification({ title: 'Zen Manager', body: `Готово: ${title} 🎉` });
      }
    } catch (e) { console.error("Notification error", e); }
  }, []);

  const addToHistory = useCallback((type: HistoryEntry['type'], description: string, data: any, clientId?: number, taskId?: number) => {
    const entry: HistoryEntry = {
      id: Date.now(),
      timestamp: Date.now(),
      type,
      data,
      description,
      userId: 'user', 
      clientId,
      taskId
    };
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(entry);
      return newHistory.slice(-50);
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const undo = useCallback((entryId: number) => {
    console.log('Undo entry:', entryId);
    setHistoryIndex(prev => Math.max(0, prev - 1));
  }, []);

  const redo = useCallback((entryId: number) => {
    console.log('Redo entry:', entryId);
    setHistoryIndex(prev => Math.min(history.length - 1, prev + 1));
  }, [history.length]);

  useEffect(() => {
    const loadData = async () => {
        try {
            const localSettings = localStorage.getItem('zen_settings');
            if (localSettings) setSettings(JSON.parse(localSettings));

            const fileExists = await exists(DB_FILENAME, { baseDir: BaseDirectory.AppLocalData });
            
            if (fileExists) {
                const content = await readTextFile(DB_FILENAME, { baseDir: BaseDirectory.AppLocalData });
                const parsed = JSON.parse(content);
                const safe = (Array.isArray(parsed) ? parsed : []).map(normalizeClient).filter(Boolean) as Client[];
                safe.sort((a, b) => a.id - b.id);
                setClients(safe);
            } else {
                await writeSafe(DB_FILENAME, '[]');
                setClients([]);
            }
        } catch (err) {
            console.error('Error loading data:', err);
            const local = localStorage.getItem('zen_backup_web');
            if (local) {
              try {
                const parsed = JSON.parse(local);
                const safe = (Array.isArray(parsed) ? parsed : []).map(normalizeClient).filter(Boolean) as Client[];
                setClients(safe);
              } catch {}
            }
        } finally {
            setIsLoaded(true);
        }
    };
    loadData();
  }, []);

  const saveClients = useCallback(async (next: Client[]) => {
    const content = JSON.stringify(next, null, 2);
    await writeSafe(DB_FILENAME, content);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const id = setTimeout(() => {
      saveClients(clients).catch(console.error);
    }, 500);
    return () => clearTimeout(id);
  }, [clients, isLoaded, saveClients]);

  useEffect(() => {
    if (!isLoaded) return;
    
    const stats = calculateUserStats(clients, userProgress.focusSessions);
    // Удалены расчеты продуктивности и предсказаний
    const unlockedAchievements = GamificationUtils.checkAchievements(stats, userProgress.achievements);
    const newUnlocked = unlockedAchievements.filter(a => a.unlockedAt && !userProgress.achievements.find(old => old.id === a.id)?.unlockedAt);
    
    if (newUnlocked.length > 0) {
      setNewAchievement(newUnlocked[0]);
      playAchievementSound();
    }

    setUserProgress(prev => ({
      ...prev,
      achievements: unlockedAchievements,
      stats,
      // productivityHealth и timePredictions не обновляем, оставляем заглушки
      timePredictions: []
    }));
  }, [clients, isLoaded, userProgress.focusSessions, playAchievementSound]);

  const startFocusSession = useCallback((sessionData: Omit<FocusSession, 'id' | 'duration'>) => {
    const session: FocusSession = {
      ...sessionData,
      id: Date.now(),
      duration: 0
    };
    
    setUserProgress(prev => ({
      ...prev,
      focusSessions: [...prev.focusSessions, session]
    }));
    
    return session.id;
  }, []);

  const endFocusSession = useCallback((sessionId: number, wasCompleted: boolean) => {
    setUserProgress(prev => {
      const updatedSessions = prev.focusSessions.map(session => {
        if (session.id === sessionId) {
          const endTime = Date.now();
          const duration = Math.floor((endTime - session.startTime) / 1000);
          return { ...session, endTime, duration, wasCompleted };
        }
        return session;
      });
      
      const totalFocusTime = updatedSessions.reduce((acc, session) => acc + session.duration, 0) / 60;
      
      return {
        ...prev,
        focusSessions: updatedSessions,
        stats: {
          ...prev.stats,
          totalFocusTime
        }
      };
    });
  }, []);

  const toggleSound = () => {
      const newSettings = { ...settings, soundEnabled: !settings.soundEnabled };
      setSettings(newSettings);
      localStorage.setItem('zen_settings', JSON.stringify(newSettings));
  };

  const exportData = () => {
      const dataStr = JSON.stringify(clients, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `zen_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const actions = {
    addClient: (name: string, priority: Priority) => {
      const newClient: Client = { 
        id: Date.now(), 
        name: name.trim(), 
        priority, 
        notes: '', 
        tasks: [],
        createdAt: Date.now()
      };
      setClients(prev => [...prev, newClient]);
      addToHistory('client_add', `Добавлен проект "${newClient.name}"`, newClient, newClient.id);
    },
    removeClient: (id: number) => {
      const client = clients.find(c => c.id === id);
      if (client) {
        setClients(prev => prev.filter(c => c.id !== id));
        addToHistory('client_remove', `Удален проект "${client.name}"`, client, id);
      }
    },
    updateClientPriority: (clientId: number, priority: Priority) => {
      const oldClient = clients.find(c => c.id === clientId);
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, priority } : c));
      if (oldClient) {
        addToHistory('client_update', `Изменен приоритет проекта "${oldClient.name}"`, { oldClient, newClient: { ...oldClient, priority } }, clientId);
      }
    },
    updateClientNotes: (clientId: number, notes: string) => {
      const oldClient = clients.find(c => c.id === clientId);
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, notes } : c));
      if (oldClient) {
        addToHistory('client_update', `Обновлены заметки проекта "${oldClient.name}"`, { oldClient, newClient: { ...oldClient, notes } }, clientId);
      }
    },
    addTask: (clientId: number, title: string, priority: Priority, effort: Effort) => {
      const newTask: Task = { 
        id: Date.now(), 
        title: title.trim(), 
        isDone: false, 
        priority, 
        effort, 
        createdAt: Date.now(),
        comments: [],
        pointsEarned: 0,
        timeSpent: 0,
        predictedTime: 0
      };
      setClients(prev => prev.map(c => 
        c.id === clientId ? { ...c, tasks: [newTask, ...c.tasks] } : c
      ));
      addToHistory('task_create', `Создана задача "${newTask.title}"`, newTask, clientId, newTask.id);
    },
    updateTaskTitle: (clientId: number, taskId: number, newTitle: string) => {
      const oldTask = clients.find(c => c.id === clientId)?.tasks.find(t => t.id === taskId);
      setClients(prev => prev.map(c => 
        c.id === clientId ? { 
            ...c, 
            tasks: c.tasks.map(t => t.id === taskId ? { ...t, title: newTitle.trim() } : t) 
        } : c
      ));
      if (oldTask) {
        addToHistory('task_update', `Изменен заголовок задачи`, { oldTask, newTask: { ...oldTask, title: newTitle.trim() } }, clientId, taskId);
      }
    },
    updateTaskPriority: (clientId: number, taskId: number, priority: Priority) => {
      const oldTask = clients.find(c => c.id === clientId)?.tasks.find(t => t.id === taskId);
      setClients(prev => prev.map(c => 
        c.id === clientId ? { 
            ...c, 
            tasks: c.tasks.map(t => t.id === taskId ? { ...t, priority } : t) 
        } : c
      ));
      if (oldTask) {
        addToHistory('task_update', `Изменен приоритет задачи`, { oldTask, newTask: { ...oldTask, priority } }, clientId, taskId);
      }
    },
    updateTaskEffort: (clientId: number, taskId: number, effort: Effort) => {
      const oldTask = clients.find(c => c.id === clientId)?.tasks.find(t => t.id === taskId);
      setClients(prev => prev.map(c => 
        c.id === clientId ? { 
            ...c, 
            tasks: c.tasks.map(t => t.id === taskId ? { ...t, effort } : t) 
        } : c
      ));
      if (oldTask) {
        addToHistory('task_update', `Изменена сложность задачи`, { oldTask, newTask: { ...oldTask, effort } }, clientId, taskId);
      }
    },
    updateTaskDueDate: (clientId: number, taskId: number, dueDate?: number) => {
      const oldTask = clients.find(c => c.id === clientId)?.tasks.find(t => t.id === taskId);
      setClients(prev => prev.map(c => 
        c.id === clientId ? { 
            ...c, 
            tasks: c.tasks.map(t => t.id === taskId ? { ...t, dueDate } : t) 
        } : c
      ));
      if (oldTask) {
        addToHistory('task_update', `Изменена дата выполнения задачи`, { oldTask, newTask: { ...oldTask, dueDate } }, clientId, taskId);
      }
    },
    addTaskComment: (clientId: number, taskId: number, text: string) => {
      const newComment: Comment = {
        id: Date.now(),
        text: text.trim(),
        createdAt: Date.now(),
        author: 'Вы'
      };
      setClients(prev => prev.map(c => 
        c.id === clientId ? { 
            ...c, 
            tasks: c.tasks.map(t => t.id === taskId ? { 
              ...t, 
              comments: [...t.comments, newComment]
            } : t) 
        } : c
      ));
      addToHistory('task_update', `Добавлен комментарий к задаче`, { comment: newComment, taskId }, clientId, taskId);
    },
    toggleTask: (clientId: number, taskId: number) => {
      const client = clients.find(c => c.id === clientId);
      const task = client?.tasks.find(t => t.id === taskId);
      
      if (!client || !task) return;

      const willBeDone = !task.isDone;
      let points = 0;
      
      if (willBeDone) {
        const completedOnTime = !task.dueDate || Date.now() <= task.dueDate;
        points = GamificationUtils.calculateTaskPoints(task.priority, task.effort, completedOnTime);
        
        playSound(); 
        sendSystemNotification(task.title);

        setUserProgress(prev => {
          const newTotalPoints = prev.totalPoints + points;
          const levelInfo = GamificationUtils.getLevelByPoints(newTotalPoints);
          const progress = GamificationUtils.getProgressToNextLevel(newTotalPoints, levelInfo.level);
          
          return {
            ...prev,
            totalPoints: newTotalPoints,
            level: levelInfo.level,
            currentLevelPoints: progress.current,
            nextLevelPoints: progress.next
          };
        });
      }

      setClients(prev => prev.map(c => {
          if (c.id !== clientId) return c;
          return {
              ...c,
              tasks: c.tasks.map(t => {
                  if (t.id === taskId) {
                      const updatedTask = { 
                          ...t, 
                          isDone: willBeDone, 
                          completedAt: willBeDone ? Date.now() : undefined,
                          pointsEarned: willBeDone ? points : undefined
                      };
                      
                      const actionType = willBeDone ? 'task_complete' : 'task_update';
                      const actionDesc = willBeDone 
                          ? `Выполнена задача "${t.title}"` 
                          : `${willBeDone ? 'Восстановлена' : 'Отмечена невыполненной'} задача "${t.title}"`;
                          
                      addToHistory(actionType, actionDesc, { task: updatedTask }, clientId, taskId);
                      
                      return updatedTask;
                  }
                  return t;
              })
          };
      }));
    },
    deleteTask: (clientId: number, taskId: number) => {
      const task = clients.find(c => c.id === clientId)?.tasks.find(t => t.id === taskId);
      if (task) {
        setClients(prev => prev.map(c => 
          c.id === clientId ? { ...c, tasks: c.tasks.filter(t => t.id !== taskId) } : c
        ));
        addToHistory('task_delete', `Удалена задача "${task.title}"`, task, clientId, taskId);
      }
    },
    reorderTasks: (clientId: number, activeId: number, overId: number) => {
      const client = clients.find(c => c.id === clientId);
      if (!client) return;
      
      const oldIndex = client.tasks.findIndex(t => t.id === activeId);
      const newIndex = client.tasks.findIndex(t => t.id === overId);
      setClients(prev => prev.map(c => {
          if (c.id !== clientId) return c;
          const reorderedTasks = arrayMove(c.tasks, oldIndex, newIndex);
          addToHistory('task_update', `Изменен порядок задач`, { fromIndex: oldIndex, toIndex: newIndex }, clientId);
          return { ...c, tasks: reorderedTasks };
      }));
    },
    toggleSound,
    exportData,
    dismissAchievement: () => {
      setNewAchievement(null);
    },
    startFocusSession,
    endFocusSession,
    undo,
    redo,
    getHistory: () => history,
    canUndo: () => historyIndex > 0,
    canRedo: () => historyIndex < history.length - 1
  };

  return {
    clients,
    isLoaded,
    settings,
    userProgress,
    newAchievement,
    actions
  };
}