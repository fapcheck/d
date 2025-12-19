import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BaseDirectory, readTextFile, writeTextFile, exists, mkdir } from '@tauri-apps/plugin-fs';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { arrayMove } from '@dnd-kit/sortable';
import { 
  DEFAULT_SETTINGS, DB_FILENAME, GamificationUtils, ACHIEVEMENTS, DateUtils
} from '../types';
import type { 
  Client, Task, Priority, Effort, AppSettings, Comment, UserProgress, Achievement, UserStats, 
  FocusSession, HistoryEntry
} from '../types';

// --- Helper: Audio Engine ---
// Kept internal to keep the main hook clean
const useAudioEngine = (enabled: boolean) => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const initCtx = useCallback(() => {
    if (!audioContextRef.current) {
      const CtxClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new CtxClass();
    }
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playSuccess = useCallback(() => {
    if (!enabled) return;
    try {
      const ctx = initCtx();
      if (!ctx) return;

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
    } catch (e) {
      console.error("Audio error", e);
    }
  }, [enabled, initCtx]);

  const playAchievement = useCallback(() => {
    if (!enabled) return;
    try {
      const ctx = initCtx();
      if (!ctx) return;

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
    } catch (e) {
      console.error("Achievement sound error", e);
    }
  }, [enabled, initCtx]);

  return { playSuccess, playAchievement };
};

// --- Helper: Type Guards & Normalization ---
const isRawTask = (t: any): t is Task => {
  return (
    typeof t?.id === 'number' &&
    typeof t?.title === 'string' &&
    typeof t?.isDone === 'boolean'
  );
};

const normalizeClient = (v: any): Client | null => {
  if (typeof v !== 'object' || v === null || typeof v.id !== 'number' || typeof v.name !== 'string') return null;
  
  const tasks = Array.isArray(v.tasks) 
    ? v.tasks.filter(isRawTask).map((t: any) => ({
        ...t,
        comments: Array.isArray(t.comments) ? t.comments : [],
        dueDate: t.dueDate || undefined,
        pointsEarned: t.pointsEarned || 0,
        timeSpent: t.timeSpent || 0,
        predictedTime: t.predictedTime || 0
      })) 
    : [];

  return {
    id: v.id,
    name: v.name,
    priority: ['high', 'normal', 'low'].includes(v.priority) ? v.priority : 'normal',
    notes: v.notes || '',
    tasks,
    createdAt: v.createdAt || Date.now(),
    targetCompletionDate: v.targetCompletionDate || undefined
  };
};

// --- Helper: Stats Calculation (Pure Function) ---
const calculateUserStats = (clients: Client[], focusSessions: FocusSession[]): UserStats => {
  let totalTasksCompleted = 0;
  const tasksByDate: { [date: string]: number } = {};
  let perfectDays = 0;
  const now = new Date();
  const today = DateUtils.startOfDay(now);

  clients.forEach(client => {
    client.tasks.forEach(task => {
      if (task.isDone && task.completedAt) {
        totalTasksCompleted++;
        const dateKey = new Date(task.completedAt).toISOString().split('T')[0];
        tasksByDate[dateKey] = (tasksByDate[dateKey] || 0) + 1;

        if (!task.dueDate || task.completedAt <= task.dueDate) {
          const perfectKey = `${dateKey}_perfect`;
          tasksByDate[perfectKey] = (tasksByDate[perfectKey] || 0) + 1;
        }
      }
    });
  });

  let currentStreak = 0;
  const dates = Object.keys(tasksByDate).filter(k => !k.endsWith('_perfect')).sort().reverse();
  
  for (let i = 0; i < dates.length; i++) {
    const d = new Date(dates[i]);
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    // Allow for "yesterday" if user hasn't completed tasks today yet
    if (DateUtils.isSameDay(d, expected) || (i === 0 && DateUtils.isSameDay(d, new Date(today.getTime() - 86400000)))) {
      currentStreak++;
    } else {
      break;
    }
  }

  const uniqueDates = Object.keys(tasksByDate).filter(k => !k.endsWith('_perfect'));
  let tasksThisWeek = 0;
  let tasksThisMonth = 0;
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthAgo = new Date(now.getTime() - 30 * 86400000);

  uniqueDates.forEach(dateStr => {
    const d = new Date(dateStr);
    const count = tasksByDate[dateStr];
    if (d >= weekAgo) tasksThisWeek += count;
    if (d >= monthAgo) tasksThisMonth += count;
    const perfectCount = tasksByDate[`${dateStr}_perfect`] || 0;
    if (count > 0 && count === perfectCount) perfectDays++;
  });

  const totalFocusTime = focusSessions.reduce((acc, s) => acc + s.duration, 0) / 60;
  const completedSessions = focusSessions.filter(s => s.wasCompleted);
  const avgSessionDuration = completedSessions.length > 0 
    ? completedSessions.reduce((acc, s) => acc + s.duration, 0) / completedSessions.length / 60 
    : 0;

  const hourPerformance = new Array(24).fill(0);
  completedSessions.forEach(s => hourPerformance[new Date(s.startTime).getHours()]++);
  const peakPerformanceHours = hourPerformance
    .map((c, h) => ({ h, c }))
    .sort((a, b) => b.c - a.c)
    .slice(0, 3)
    .map(x => x.h);

  return {
    totalTasksCompleted,
    currentStreak,
    maxStreak: Math.max(currentStreak, 0),
    totalFocusTime,
    tasksThisWeek,
    tasksThisMonth,
    perfectDays,
    averageTasksPerDay: uniqueDates.length ? Math.round((totalTasksCompleted / uniqueDates.length) * 10) / 10 : 0,
    bestDay: { date: '', tasks: 0 },
    consistencyScore: uniqueDates.length ? Math.min(100, Math.round((currentStreak / 7) * 100)) : 0,
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
  
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  
  // Track unlocked achievements to fire notifications, but DON'T store all achievements in state
  const prevUnlockedIds = useRef<Set<string>>(new Set());

  const { playSuccess, playAchievement } = useAudioEngine(settings.soundEnabled);

  const isSaving = useRef(false);
  const saveQueue = useRef<Client[] | null>(null);

  // --- Initial Load ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const localSettings = localStorage.getItem('zen_settings');
        if (localSettings) setSettings(JSON.parse(localSettings));

        let loadedClients: Client[] = [];
        try {
          await mkdir('', { baseDir: BaseDirectory.AppLocalData, recursive: true });
          
          if (await exists(DB_FILENAME, { baseDir: BaseDirectory.AppLocalData })) {
            const content = await readTextFile(DB_FILENAME, { baseDir: BaseDirectory.AppLocalData });
            const parsed = JSON.parse(content);
            loadedClients = (Array.isArray(parsed) ? parsed : []).map(normalizeClient).filter(Boolean) as Client[];
          } else {
            await writeTextFile(DB_FILENAME, '[]', { baseDir: BaseDirectory.AppLocalData });
          }
        } catch (fsErr) {
          console.warn('FS Access failed, falling back to localStorage', fsErr);
          const local = localStorage.getItem('zen_backup_web');
          if (local) {
             loadedClients = (JSON.parse(local) as any[]).map(normalizeClient).filter(Boolean) as Client[];
          }
        }

        const localSessions = localStorage.getItem('zen_sessions');
        if (localSessions) setFocusSessions(JSON.parse(localSessions));

        setClients(loadedClients.sort((a, b) => a.id - b.id));
      } catch (err) {
        console.error('Critical error loading data:', err);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  // --- Persistence ---
  const saveToDisk = async (data: Client[]) => {
    if (isSaving.current) {
      saveQueue.current = data;
      return;
    }

    isSaving.current = true;
    try {
      const content = JSON.stringify(data, null, 2);
      try {
        await writeTextFile(DB_FILENAME, content, { baseDir: BaseDirectory.AppLocalData });
      } catch (e) {
        localStorage.setItem('zen_backup_web', content);
      }
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      isSaving.current = false;
      if (saveQueue.current) {
        const nextData = saveQueue.current;
        saveQueue.current = null;
        saveToDisk(nextData);
      }
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => saveToDisk(clients), 1000);
    return () => clearTimeout(timer);
  }, [clients, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('zen_sessions', JSON.stringify(focusSessions));
  }, [focusSessions, isLoaded]);

  // --- Derived State (Stats & Achievements) ---
  const userProgress = useMemo((): UserProgress => {
    if (!isLoaded) {
      return {
        totalPoints: 0, level: 1, currentLevelPoints: 0, nextLevelPoints: 100,
        achievements: ACHIEVEMENTS, focusSessions: [], 
        stats: calculateUserStats([], []), history: [], timePredictions: [],
        productivityHealth: {} as any
      };
    }

    // 1. Calculate Stats
    const stats = calculateUserStats(clients, focusSessions);
    
    // 2. Derive Achievements deterministically (No setState required!)
    const derivedAchievements = GamificationUtils.checkAchievements(stats, ACHIEVEMENTS);
    
    // 3. Calculate Points/Level
    const totalPoints = clients.reduce((acc, c) => 
      acc + c.tasks.reduce((sum, t) => sum + (t.isDone ? (t.pointsEarned || 0) : 0), 0), 0
    );
    const levelInfo = GamificationUtils.getLevelByPoints(totalPoints);
    const progress = GamificationUtils.getProgressToNextLevel(totalPoints, levelInfo.level);

    return {
      totalPoints,
      level: levelInfo.level,
      currentLevelPoints: progress.current,
      nextLevelPoints: progress.next,
      achievements: derivedAchievements, // Use the derived list directly
      stats,
      focusSessions,
      history,
      timePredictions: [],
      productivityHealth: {
        score: stats.consistencyScore,
        level: stats.consistencyScore > 80 ? 'excellent' : 'good',
        factors: [],
        recommendations: [],
        trends: { direction: 'stable', change: 0, period: 'week', prediction: { nextWeek: 0, confidence: 0 }}
      }
    };
  }, [clients, focusSessions, isLoaded, history]);

  // --- Achievement Notifications ---
  // We only use Effect to trigger the "New Achievement" toast, not to store data
  useEffect(() => {
    if (!isLoaded) return;

    // Initialize the ref on first load so we don't blast notifications for old achievements
    if (prevUnlockedIds.current.size === 0) {
        userProgress.achievements.forEach(a => {
            if (a.unlockedAt) prevUnlockedIds.current.add(a.id);
        });
        return;
    }

    // Check for new unlocks
    const newUnlock = userProgress.achievements.find(a => 
        a.unlockedAt && !prevUnlockedIds.current.has(a.id)
    );

    if (newUnlock) {
      prevUnlockedIds.current.add(newUnlock.id);
      setNewAchievement(newUnlock);
      playAchievement();
    }
  }, [userProgress.achievements, isLoaded, playAchievement]);

  // --- Actions ---

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
    setHistory(prev => {
      const entry: HistoryEntry = {
        id: Date.now(),
        timestamp: Date.now(),
        type, data, description, userId: 'user', clientId, taskId
      };
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(entry);
      return newHistory.slice(-50);
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const undo = useCallback((entryId: number) => {
    setHistoryIndex(prev => Math.max(0, prev - 1));
  }, []);

  const redo = useCallback((entryId: number) => {
    setHistoryIndex(prev => Math.min(history.length - 1, prev + 1));
  }, [history.length]);

  const actions = {
    addClient: (name: string, priority: Priority) => {
      const newClient: Client = { 
        id: Date.now(), name: name.trim(), priority, notes: '', tasks: [], createdAt: Date.now()
      };
      setClients(prev => [...prev, newClient]);
      addToHistory('client_add', `Added project "${newClient.name}"`, newClient, newClient.id);
    },
    removeClient: (id: number) => {
      const client = clients.find(c => c.id === id);
      if (client) {
        setClients(prev => prev.filter(c => c.id !== id));
        addToHistory('client_remove', `Removed "${client.name}"`, client, id);
      }
    },
    updateClientPriority: (id: number, priority: Priority) => {
      setClients(prev => prev.map(c => c.id === id ? { ...c, priority } : c));
    },
    updateClientNotes: (id: number, notes: string) => {
      setClients(prev => prev.map(c => c.id === id ? { ...c, notes } : c));
    },
    addTask: (clientId: number, title: string, priority: Priority, effort: Effort) => {
      const newTask: Task = { 
        id: Date.now(), title: title.trim(), isDone: false, priority, effort, 
        createdAt: Date.now(), comments: [], pointsEarned: 0, timeSpent: 0, predictedTime: 0
      };
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, tasks: [newTask, ...c.tasks] } : c));
      addToHistory('task_create', `Created "${newTask.title}"`, newTask, clientId, newTask.id);
    },
    updateTaskTitle: (cId: number, tId: number, title: string) => {
      setClients(prev => prev.map(c => c.id === cId ? { 
        ...c, tasks: c.tasks.map(t => t.id === tId ? { ...t, title: title.trim() } : t) 
      } : c));
    },
    updateTaskPriority: (cId: number, tId: number, priority: Priority) => {
      setClients(prev => prev.map(c => c.id === cId ? { 
        ...c, tasks: c.tasks.map(t => t.id === tId ? { ...t, priority } : t) 
      } : c));
    },
    updateTaskEffort: (cId: number, tId: number, effort: Effort) => {
      setClients(prev => prev.map(c => c.id === cId ? { 
        ...c, tasks: c.tasks.map(t => t.id === tId ? { ...t, effort } : t) 
      } : c));
    },
    updateTaskDueDate: (cId: number, tId: number, dueDate?: number) => {
      setClients(prev => prev.map(c => c.id === cId ? { 
        ...c, tasks: c.tasks.map(t => t.id === tId ? { ...t, dueDate } : t) 
      } : c));
    },
    addTaskComment: (cId: number, tId: number, text: string) => {
      const comment: Comment = { id: Date.now(), text: text.trim(), createdAt: Date.now(), author: 'You' };
      setClients(prev => prev.map(c => c.id === cId ? { 
        ...c, tasks: c.tasks.map(t => t.id === tId ? { ...t, comments: [...t.comments, comment] } : t) 
      } : c));
    },
    toggleTask: (cId: number, tId: number) => {
      let earnedPoints = 0;
      let taskTitle = '';

      setClients(prev => prev.map(c => {
        if (c.id !== cId) return c;
        return {
          ...c,
          tasks: c.tasks.map(t => {
            if (t.id !== tId) return t;
            
            const willBeDone = !t.isDone;
            taskTitle = t.title;
            
            if (willBeDone) {
              const onTime = !t.dueDate || Date.now() <= t.dueDate;
              earnedPoints = GamificationUtils.calculateTaskPoints(t.priority, t.effort, onTime);
            }

            return {
              ...t,
              isDone: willBeDone,
              completedAt: willBeDone ? Date.now() : undefined,
              pointsEarned: willBeDone ? earnedPoints : undefined
            };
          })
        };
      }));

      // Side effects triggered after state update logic
      if (earnedPoints > 0) {
        playSuccess();
        sendSystemNotification(taskTitle);
      }
    },
    deleteTask: (cId: number, tId: number) => {
      setClients(prev => prev.map(c => c.id === cId ? { ...c, tasks: c.tasks.filter(t => t.id !== tId) } : c));
    },
    reorderTasks: (cId: number, activeId: number, overId: number) => {
      setClients(prev => prev.map(c => {
        if (c.id !== cId) return c;
        const oldIndex = c.tasks.findIndex(t => t.id === activeId);
        const newIndex = c.tasks.findIndex(t => t.id === overId);
        return { ...c, tasks: arrayMove(c.tasks, oldIndex, newIndex) };
      }));
    },
    toggleSound: () => {
      const next = { ...settings, soundEnabled: !settings.soundEnabled };
      setSettings(next);
      localStorage.setItem('zen_settings', JSON.stringify(next));
    },
    exportData: () => {
      const blob = new Blob([JSON.stringify(clients, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `zen_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    startFocusSession: (data: Omit<FocusSession, 'id' | 'duration'>) => {
      const id = Date.now();
      setFocusSessions(prev => [...prev, { ...data, id, duration: 0 }]);
      return id;
    },
    endFocusSession: (id: number, wasCompleted: boolean) => {
      setFocusSessions(prev => prev.map(s => {
        if (s.id !== id) return s;
        const endTime = Date.now();
        return { ...s, endTime, duration: Math.floor((endTime - s.startTime) / 1000), wasCompleted };
      }));
    },
    undo, redo, getHistory: () => history, dismissAchievement: () => setNewAchievement(null),
    canUndo: () => historyIndex > 0, canRedo: () => historyIndex < history.length - 1
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