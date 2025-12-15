import { useState, useEffect, useRef } from 'react';
import { BaseDirectory, readTextFile, writeTextFile, exists } from '@tauri-apps/plugin-fs';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { arrayMove } from '@dnd-kit/sortable';
import { DEFAULT_SETTINGS } from '../types';
import type { Client, Task, Priority, Effort, AppSettings } from '../types';

const DB_FILENAME = 'zen-db.json';

export function useZenData() {
  const [clients, setClients] = useState<Client[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const clientsRef = useRef<Client[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    clientsRef.current = clients;
  }, [clients]);

  // --- AUDIO ENGINE ---
  const playSound = () => {
    if (!settings.soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
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
  };

  const sendSystemNotification = async (title: string) => {
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
  };

  // --- FILE SYSTEM STORAGE ---

  const saveDataToDisk = async (newClients: Client[]) => {
    try {
      const content = JSON.stringify(newClients, null, 2);
      await writeTextFile(DB_FILENAME, content, { baseDir: BaseDirectory.AppLocalData });
    } catch (err) {
      console.error('Failed to save data:', err);
    }
  };

  const loadDataFromDisk = async () => {
    try {
      const dirExists = await exists('', { baseDir: BaseDirectory.AppLocalData });
      if (!dirExists) {
          // mkdir logic handled by OS or installer usually, but strictly we might check here
      }

      const fileExists = await exists(DB_FILENAME, { baseDir: BaseDirectory.AppLocalData });
      
      if (fileExists) {
        const content = await readTextFile(DB_FILENAME, { baseDir: BaseDirectory.AppLocalData });
        const parsed = JSON.parse(content);
        parsed.sort((a: Client, b: Client) => a.id - b.id);
        setClients(parsed);
      } else {
        await writeTextFile(DB_FILENAME, '[]', { baseDir: BaseDirectory.AppLocalData });
        setClients([]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      const local = localStorage.getItem('zen_backup_web');
      if (local) setClients(JSON.parse(local));
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    const localSettings = localStorage.getItem('zen_settings');
    if (localSettings) {
        setSettings(JSON.parse(localSettings));
    }
    loadDataFromDisk();
  }, []);

  // --- ACTIONS ---

  const updateClientsState = (updater: (prev: Client[]) => Client[]) => {
      setClients(prev => {
          const newState = updater(prev);
          saveDataToDisk(newState);
          return newState;
      });
  };

  const toggleSound = () => {
      const newSettings = { ...settings, soundEnabled: !settings.soundEnabled };
      setSettings(newSettings);
      localStorage.setItem('zen_settings', JSON.stringify(newSettings));
  };

  const exportData = async () => {
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

  const addClient = (name: string, priority: Priority) => {
    const newClient: Client = { id: Date.now(), name, priority, notes: '', tasks: [] };
    updateClientsState(prev => [...prev, newClient]);
  };

  const removeClient = (id: number) => {
    updateClientsState(prev => prev.filter(c => c.id !== id));
  };

  const updateClientPriority = (clientId: number, priority: Priority) => {
    updateClientsState(prev => prev.map(c => c.id === clientId ? { ...c, priority } : c));
  };

  const updateClientNotes = (clientId: number, notes: string) => {
    updateClientsState(prev => prev.map(c => c.id === clientId ? { ...c, notes } : c));
  };

  const addTask = (clientId: number, title: string, priority: Priority, effort: Effort) => {
    const newTask: Task = { id: Date.now(), title, isDone: false, priority, effort, createdAt: Date.now() };
    updateClientsState(prev => prev.map(c => 
        c.id === clientId ? { ...c, tasks: [newTask, ...c.tasks] } : c
    ));
  };

  const updateTaskTitle = (clientId: number, taskId: number, newTitle: string) => {
    updateClientsState(prev => prev.map(c => 
        c.id === clientId ? { 
            ...c, 
            tasks: c.tasks.map(t => t.id === taskId ? { ...t, title: newTitle } : t) 
        } : c
    ));
  };

  // НОВЫЕ ФУНКЦИИ
  const updateTaskPriority = (clientId: number, taskId: number, priority: Priority) => {
    updateClientsState(prev => prev.map(c => 
        c.id === clientId ? { 
            ...c, 
            tasks: c.tasks.map(t => t.id === taskId ? { ...t, priority } : t) 
        } : c
    ));
  };

  const updateTaskEffort = (clientId: number, taskId: number, effort: Effort) => {
    updateClientsState(prev => prev.map(c => 
        c.id === clientId ? { 
            ...c, 
            tasks: c.tasks.map(t => t.id === taskId ? { ...t, effort } : t) 
        } : c
    ));
  };

  const toggleTask = (clientId: number, taskId: number) => {
    updateClientsState(prev => prev.map(c => {
        if (c.id !== clientId) return c;
        return {
            ...c,
            tasks: c.tasks.map(t => {
                if (t.id === taskId) {
                    const willBeDone = !t.isDone;
                    if (willBeDone) { 
                        playSound(); 
                        sendSystemNotification(t.title); 
                    }
                    return { ...t, isDone: willBeDone, completedAt: willBeDone ? Date.now() : undefined };
                }
                return t;
            })
        };
    }));
  };

  const deleteTask = (clientId: number, taskId: number) => {
    updateClientsState(prev => prev.map(c => 
        c.id === clientId ? { ...c, tasks: c.tasks.filter(t => t.id !== taskId) } : c
    ));
  };

  const reorderTasks = (clientId: number, activeId: number, overId: number) => {
      updateClientsState(prev => prev.map(c => {
          if (c.id !== clientId) return c;
          const oldIndex = c.tasks.findIndex(t => t.id === activeId);
          const newIndex = c.tasks.findIndex(t => t.id === overId);
          if (oldIndex !== -1 && newIndex !== -1) {
             return { ...c, tasks: arrayMove(c.tasks, oldIndex, newIndex) };
          }
          return c;
      }));
  };

  return {
    clients,
    isLoaded,
    settings,
    actions: {
      addClient,
      removeClient,
      updateClientPriority,
      updateClientNotes,
      addTask,
      updateTaskTitle,
      updateTaskPriority, // <-- Экспортируем
      updateTaskEffort,   // <-- Экспортируем
      toggleTask,
      deleteTask,
      reorderTasks,
      toggleSound,
      exportData
    }
  };
}