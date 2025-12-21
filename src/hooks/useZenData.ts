import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BaseDirectory, readTextFile, writeTextFile, exists, mkdir } from '@tauri-apps/plugin-fs';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { arrayMove } from '@dnd-kit/sortable';
import { DEFAULT_SETTINGS, DB_FILENAME, ACHIEVEMENTS } from '../constants';
import { DateUtils, GamificationUtils, AnalyticsUtils } from '../utils';
import type {
  Client, Task, Priority, Effort, AppSettings, Comment, UserProgress, Achievement, UserStats,
  FocusSession, HistoryEntry, HistoryData, NoteItem
} from '../types';
import { useAudioEngine } from './useAudioEngine';
import { useConfetti } from './useConfetti';


// --- Helper: Type Guards & Normalization ---
const isRawTask = (t: unknown): t is Task => {
  if (typeof t !== 'object' || t === null) return false;
  const obj = t as Record<string, unknown>;
  return (
    typeof obj.id === 'number' &&
    typeof obj.title === 'string' &&
    typeof obj.isDone === 'boolean'
  );
};

const normalizeClient = (v: unknown): Client | null => {
  if (typeof v !== 'object' || v === null) return null;
  const obj = v as Record<string, unknown>;
  if (typeof obj.id !== 'number' || typeof obj.name !== 'string') return null;

  const rawTasks = Array.isArray(obj.tasks) ? obj.tasks : [];
  const tasks = rawTasks.filter(isRawTask).map((t: Task) => ({
    ...t,
    comments: Array.isArray(t.comments) ? t.comments : [],
    dueDate: t.dueDate || undefined,
    pointsEarned: t.pointsEarned || 0,
    timeSpent: t.timeSpent || 0,
    predictedTime: t.predictedTime || 0
  }));

  return {
    id: obj.id,
    name: obj.name,
    priority: (['high', 'normal', 'low'] as const).includes(obj.priority as Priority) ? (obj.priority as Priority) : 'normal',
    notes: Array.isArray(obj.notes) ? obj.notes : (typeof obj.notes === 'string' && obj.notes ? [{ id: Date.now(), content: obj.notes, createdAt: Date.now() }] : []),
    accounts: Array.isArray(obj.accounts) ? obj.accounts : (typeof obj.accounts_notes === 'string' && obj.accounts_notes ? [{ id: Date.now() + 1, content: obj.accounts_notes, createdAt: Date.now() }] : []),
    tasks,
    createdAt: typeof obj.createdAt === 'number' ? obj.createdAt : Date.now(),
    targetCompletionDate: typeof obj.targetCompletionDate === 'number' ? obj.targetCompletionDate : undefined
  };
};

// --- Helper: Stats Calculation ---
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

  // OPTIMIZATION: Refs for stable callbacks
  const clientsRef = useRef(clients);
  const settingsRef = useRef(settings);
  const historyRef = useRef(history);
  const historyIndexRef = useRef(historyIndex);

  useEffect(() => { clientsRef.current = clients; }, [clients]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { historyIndexRef.current = historyIndex; }, [historyIndex]);

  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

  const prevUnlockedIds = useRef<Set<string>>(new Set());
  const { playSuccess, playAchievement, playAmbient, stopAmbient, isAmbientPlaying } = useAudioEngine(settings.soundEnabled);
  const { fireTaskComplete, fireAchievement } = useConfetti();

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
      } catch {
        // Critical error loading data - app will show empty state
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
    } catch {
      // Save failed silently - data will be retried on next change
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

  // --- Derived State ---
  const userProgress = useMemo((): UserProgress => {
    if (!isLoaded) {
      return {
        totalPoints: 0, level: 1, currentLevelPoints: 0, nextLevelPoints: 100,
        achievements: ACHIEVEMENTS, focusSessions: [],
        stats: calculateUserStats([], []), history: [], timePredictions: [],
        productivityHealth: {} as any
      };
    }

    const stats = calculateUserStats(clients, focusSessions);
    const derivedAchievements = GamificationUtils.checkAchievements(stats, ACHIEVEMENTS);
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
      achievements: derivedAchievements,
      stats,
      focusSessions,
      history,
      timePredictions: [],
      productivityHealth: {
        score: stats.consistencyScore,
        level: stats.consistencyScore > 80 ? 'excellent' : 'good',
        factors: [],
        recommendations: [],
        trends: { direction: 'stable', change: 0, period: 'week', prediction: { nextWeek: 0, confidence: 0 } }
      }
    };
  }, [clients, focusSessions, isLoaded, history]);

  // --- Achievement Notifications ---
  useEffect(() => {
    if (!isLoaded) return;
    if (prevUnlockedIds.current.size === 0) {
      userProgress.achievements.forEach(a => {
        if (a.unlockedAt) prevUnlockedIds.current.add(a.id);
      });
      return;
    }
    const newUnlock = userProgress.achievements.find(a =>
      a.unlockedAt && !prevUnlockedIds.current.has(a.id)
    );
    if (newUnlock) {
      prevUnlockedIds.current.add(newUnlock.id);
      setNewAchievement(newUnlock);
      playAchievement();
      fireAchievement();
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
    } catch { /* Notification permission denied or unavailable */ }
  }, []);

  const addToHistory = useCallback((type: HistoryEntry['type'], description: string, data: HistoryData, clientId?: number, taskId?: number) => {
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

  const applyChange = useCallback((entry: HistoryEntry, isUndo: boolean) => {
    // Helper to determine if we should do the forward or reverse action
    // Undo: reverse action. Redo: forward action.
    const action = isUndo ? 'reverse' : 'forward';

    switch (entry.type) {
      case 'client_add': {
        const client = entry.data as Client;
        if (action === 'reverse') {
          setClients(prev => prev.filter(c => c.id !== client.id));
        } else {
          setClients(prev => [...prev, client].sort((a, b) => a.id - b.id));
        }
        break;
      }
      case 'client_remove': {
        const client = entry.data as Client;
        if (action === 'reverse') {
          setClients(prev => [...prev, client].sort((a, b) => a.id - b.id));
        } else {
          setClients(prev => prev.filter(c => c.id !== client.id));
        }
        break;
      }
      case 'task_create': {
        const task = entry.data as Task;
        const clientId = entry.clientId as number;
        if (action === 'reverse') {
          setClients(prev => prev.map(c => c.id === clientId ? { ...c, tasks: c.tasks.filter(t => t.id !== task.id) } : c));
        } else {
          setClients(prev => prev.map(c => c.id === clientId ? { ...c, tasks: [task, ...c.tasks] } : c));
        }
        break;
      }
      case 'task_delete': {
        const task = entry.data as Task;
        const clientId = entry.clientId as number;
        if (action === 'reverse') {
          setClients(prev => prev.map(c => c.id === clientId ? { ...c, tasks: [task, ...c.tasks] } : c));
        } else {
          setClients(prev => prev.map(c => c.id === clientId ? { ...c, tasks: c.tasks.filter(t => t.id !== task.id) } : c));
        }
        break;
      }
      case 'task_complete': {
        const { taskId, clientId } = entry;
        const data = entry.data as { isDone: boolean };
        // If forward: sets to stored state (data.isDone)
        // If reverse: sets to opposite of stored state (!data.isDone)
        const targetState = action === 'forward' ? data.isDone : !data.isDone;

        setClients(prev => prev.map(c => {
          if (c.id !== clientId) return c;
          return {
            ...c,
            tasks: c.tasks.map(t => {
              if (t.id !== taskId) return t;
              return { ...t, isDone: targetState, completedAt: targetState ? Date.now() : undefined };
            })
          };
        }));
        break;
      }
    }
  }, []);

  const undo = useCallback(() => {
    const idx = historyIndexRef.current;
    if (idx < 0) return;
    const entry = historyRef.current[idx];
    applyChange(entry, true);
    setHistoryIndex(prev => Math.max(prev - 1, -1));
  }, [applyChange]);

  const redo = useCallback(() => {
    const idx = historyIndexRef.current;
    const hist = historyRef.current;
    if (idx >= hist.length - 1) return;
    const entry = hist[idx + 1];
    applyChange(entry, false);
    setHistoryIndex(prev => Math.min(prev + 1, hist.length - 1));
  }, [applyChange]);

  const actions = useMemo(() => ({
    sendSystemNotification,
    addClient: (name: string, priority: Priority) => {
      const newClient: Client = {
        id: Date.now(), name: name.trim(), priority, notes: [], accounts: [], tasks: [], createdAt: Date.now()
      };
      setClients(prev => [...prev, newClient]);
      addToHistory('client_add', `Added project "${newClient.name}"`, newClient as any, newClient.id);
    },
    removeClient: (id: number) => {
      const client = clientsRef.current.find(c => c.id === id);
      if (client) {
        setClients(prev => prev.filter(c => c.id !== id));
        addToHistory('client_remove', `Removed "${client.name}"`, client as any, id);
      }
    },
    // ... existing updates
    updateClientPriority: (id: number, priority: Priority) => {
      setClients(prev => prev.map(c => c.id === id ? { ...c, priority } : c));
    },
    addNote: (clientId: number, content: string) => {
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, notes: [{ id: Date.now(), content, createdAt: Date.now() }, ...c.notes] } : c));
    },
    deleteNote: (clientId: number, noteId: number) => {
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, notes: c.notes.filter(n => n.id !== noteId) } : c));
    },
    updateNote: (clientId: number, noteId: number, content: string) => {
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, notes: c.notes.map(n => n.id === noteId ? { ...n, content } : n) } : c));
    },
    addAccount: (clientId: number, content: string) => {
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, accounts: [{ id: Date.now(), content, createdAt: Date.now() }, ...c.accounts] } : c));
    },
    deleteAccount: (clientId: number, accountId: number) => {
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, accounts: c.accounts.filter(a => a.id !== accountId) } : c));
    },
    updateAccount: (clientId: number, accountId: number, content: string) => {
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, accounts: c.accounts.map(a => a.id === accountId ? { ...a, content } : a) } : c));
    },
    updateClientProfile: (clientId: number, profile: any) => {
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, dmcaProfile: profile } : c));
    },
    addTask: (clientId: number, title: string, priority: Priority, effort: Effort) => {
      const newTask: Task = {
        id: Date.now(), title: title.trim(), isDone: false, priority, effort,
        createdAt: Date.now(), comments: [], pointsEarned: 0, timeSpent: 0, predictedTime: 0
      };
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, tasks: [newTask, ...c.tasks] } : c));
      addToHistory('task_create', `Created "${newTask.title}"`, newTask, clientId, newTask.id);
    },
    // ... addTaskToMany omitted for brevity, keeping existing logic but maybe won't undo perfectly yet
    addTaskToMany: (clientIds: number[], title: string, priority: Priority, effort: Effort) => {
      // Keeping as is for now, complex to fully reverse without batch logic
      const cleanTitle = title.trim();
      const uniqueClientIds = Array.from(new Set(clientIds)).filter(Boolean);
      if (!cleanTitle || uniqueClientIds.length === 0) return;

      const baseId = Date.now() * 1000;
      const createdAt = Date.now();

      setClients(prev =>
        prev.map(client => {
          if (!uniqueClientIds.includes(client.id)) return client;
          const idx = uniqueClientIds.indexOf(client.id);
          const newTask: Task = {
            id: baseId + idx,
            title: cleanTitle,
            isDone: false,
            priority,
            effort,
            createdAt,
            comments: [],
            pointsEarned: 0,
            timeSpent: 0,
            predictedTime: 0
          };
          return { ...client, tasks: [newTask, ...client.tasks] };
        })
      );
      // Note: Generic history entry, won't be fully revocable by new applyChange yet
      addToHistory(
        'task_create',
        `Created "${cleanTitle}" for ${uniqueClientIds.length} projects`,
        { title: cleanTitle, priority, effort } as any,
        undefined
      );
    },
    addTaskToAll: (title: string, priority: Priority, effort: Effort) => {
      const allIds = clientsRef.current.map(c => c.id);
      actions.addTaskToMany(allIds, title, priority, effort);
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
            // Add history only if we are marking as DONE (user mental model: undo completion)
            // Or should we track un-completion too? Standard is track all.
            return {
              ...t,
              isDone: willBeDone,
              completedAt: willBeDone ? Date.now() : undefined,
              pointsEarned: willBeDone ? earnedPoints : undefined
            };
          })
        };
      }));

      // NOTE: We need to trigger this OUTSIDE the map to avoid side effects during render/set state? 
      // No, this is inside an event handler, so it's fine.
      // But we need to know if it was actually toggled.
      // The previous logic had a side effect for notification.
      // Let's replicate that and add history.

      // Since we don't have the task object easily here without searching, 
      // let's rely on finding it.
      const client = clientsRef.current.find(c => c.id === cId);
      const task = client?.tasks.find(t => t.id === tId);

      if (task) {
        const willBeDone = !task.isDone;
        addToHistory(
          'task_complete',
          `Marked "${task.title}" as ${willBeDone ? 'done' : 'todo'}`,
          { isDone: willBeDone } as any,
          cId,
          tId
        );

        if (willBeDone) {
          // re-calculate points logic for notification
          const onTime = !task.dueDate || Date.now() <= task.dueDate;
          const points = GamificationUtils.calculateTaskPoints(task.priority, task.effort, onTime);
          if (points > 0) {
            playSuccess();
            fireTaskComplete({ intensity: points > 15 ? 'celebration' : 'light' });
            sendSystemNotification(task.title);
          }
        }
      }
    },
    deleteTask: (cId: number, tId: number) => {
      const client = clientsRef.current.find(c => c.id === cId);
      const task = client?.tasks.find(t => t.id === tId);
      if (task) {
        setClients(prev => prev.map(c => c.id === cId ? { ...c, tasks: c.tasks.filter(t => t.id !== tId) } : c));
        addToHistory('task_delete', `Deleted "${task.title}"`, task as any, cId, tId);
      }
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
      const current = settingsRef.current;
      const next = { ...current, soundEnabled: !current.soundEnabled };
      setSettings(next);
      localStorage.setItem('zen_settings', JSON.stringify(next));
    },
    updateSettings: (newSettings: Partial<AppSettings>) => {
      setSettings(prev => {
        const next = { ...prev, ...newSettings };
        localStorage.setItem('zen_settings', JSON.stringify(next));
        return next;
      });
    },
    addDmcaSite: (site: string) => {
      setSettings(prev => {
        const currentSites = prev.dmcaSites || [];
        if (currentSites.includes(site)) return prev;
        const updated = { ...prev, dmcaSites: [...currentSites, site].sort() };
        localStorage.setItem('zen_settings', JSON.stringify(updated));
        return updated;
      });
    },
    removeDmcaSite: (site: string) => {
      setSettings(prev => {
        const updated = { ...prev, dmcaSites: (prev.dmcaSites || []).filter(s => s !== site) };
        localStorage.setItem('zen_settings', JSON.stringify(updated));
        return updated;
      });
    },
    renameDmcaSite: (oldName: string, newName: string) => {
      setSettings(prev => {
        const currentSites = prev.dmcaSites || [];
        const updatedSites = currentSites.map(s => s === oldName ? newName.trim() : s).sort();
        const updated = { ...prev, dmcaSites: updatedSites };
        localStorage.setItem('zen_settings', JSON.stringify(updated));
        return updated;
      });
    },
    exportData: () => {
      const blob = new Blob([JSON.stringify(clientsRef.current, null, 2)], { type: "application/json" });
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
    undo, redo, getHistory: () => historyRef.current, dismissAchievement: () => setNewAchievement(null),
    canUndo: () => historyIndexRef.current > 0, canRedo: () => historyIndexRef.current < historyRef.current.length - 1,
    toggleAmbient: (enable: boolean) => {
      if (enable) playAmbient();
      else stopAmbient();
    }
  }), [addToHistory, playSuccess, fireTaskComplete, sendSystemNotification, undo, redo, applyChange, playAmbient, stopAmbient]);

  return {
    clients,
    isLoaded,
    settings,
    userProgress,
    newAchievement,
    historyIndex,
    actions,
    isAmbientPlaying
  };
}