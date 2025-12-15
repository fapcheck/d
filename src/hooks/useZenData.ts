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
  
  // Ref для аудио контекста, чтобы не пересоздавать
  const audioContextRef = useRef<AudioContext | null>(null);

  // --- AUDIO ENGINE ---
  const playSound = () => {
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

  // Загрузка данных при старте
  useEffect(() => {
    const loadData = async () => {
        try {
            // 1. Загружаем настройки
            const localSettings = localStorage.getItem('zen_settings');
            if (localSettings) setSettings(JSON.parse(localSettings));

            // 2. Проверяем наличие файла БД
            const fileExists = await exists(DB_FILENAME, { baseDir: BaseDirectory.AppLocalData });
            
            if (fileExists) {
                const content = await readTextFile(DB_FILENAME, { baseDir: BaseDirectory.AppLocalData });
                const parsed = JSON.parse(content);
                // Сортировка для стабильности
                parsed.sort((a: Client, b: Client) => a.id - b.id);
                setClients(parsed);
            } else {
                // Если файла нет, создаем пустой
                await writeTextFile(DB_FILENAME, '[]', { baseDir: BaseDirectory.AppLocalData });
                setClients([]);
            }
        } catch (err) {
            console.error('Error loading data:', err);
            // Fallback на localStorage в браузере (для отладки без Tauri)
            const local = localStorage.getItem('zen_backup_web');
            if (local) setClients(JSON.parse(local));
        } finally {
            setIsLoaded(true);
        }
    };
    loadData();
  }, []);

  // Автосохранение (Эффект реагирует на изменение clients)
  useEffect(() => {
      if (!isLoaded) return; // Не сохранять, пока не загрузились (защита от перезаписи пустым массивом)

      const saveToDisk = async () => {
          try {
              const content = JSON.stringify(clients, null, 2);
              await writeTextFile(DB_FILENAME, content, { baseDir: BaseDirectory.AppLocalData });
          } catch (err) {
              console.error('Failed to save data:', err);
              // Бэкап в localStorage на всякий случай
              localStorage.setItem('zen_backup_web', JSON.stringify(clients));
          }
      };

      // Debounce: сохраняем не чаще, чем раз в 500мс (полезно при печати заметок)
      const timeoutId = setTimeout(saveToDisk, 500);
      return () => clearTimeout(timeoutId);

  }, [clients, isLoaded]);


  // --- ACTIONS (Теперь они просто меняют стейт, сохранение делает useEffect) ---

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

  const addClient = (name: string, priority: Priority) => {
    const newClient: Client = { id: Date.now(), name, priority, notes: '', tasks: [] };
    setClients(prev => [...prev, newClient]);
  };

  const removeClient = (id: number) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const updateClientPriority = (clientId: number, priority: Priority) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, priority } : c));
  };

  const updateClientNotes = (clientId: number, notes: string) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, notes } : c));
  };

  const addTask = (clientId: number, title: string, priority: Priority, effort: Effort) => {
    const newTask: Task = { id: Date.now(), title, isDone: false, priority, effort, createdAt: Date.now() };
    setClients(prev => prev.map(c => 
        c.id === clientId ? { ...c, tasks: [newTask, ...c.tasks] } : c
    ));
  };

  const updateTaskTitle = (clientId: number, taskId: number, newTitle: string) => {
    setClients(prev => prev.map(c => 
        c.id === clientId ? { 
            ...c, 
            tasks: c.tasks.map(t => t.id === taskId ? { ...t, title: newTitle } : t) 
        } : c
    ));
  };

  const updateTaskPriority = (clientId: number, taskId: number, priority: Priority) => {
    setClients(prev => prev.map(c => 
        c.id === clientId ? { 
            ...c, 
            tasks: c.tasks.map(t => t.id === taskId ? { ...t, priority } : t) 
        } : c
    ));
  };

  const updateTaskEffort = (clientId: number, taskId: number, effort: Effort) => {
    setClients(prev => prev.map(c => 
        c.id === clientId ? { 
            ...c, 
            tasks: c.tasks.map(t => t.id === taskId ? { ...t, effort } : t) 
        } : c
    ));
  };

  const toggleTask = (clientId: number, taskId: number) => {
    setClients(prev => prev.map(c => {
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
    setClients(prev => prev.map(c => 
        c.id === clientId ? { ...c, tasks: c.tasks.filter(t => t.id !== taskId) } : c
    ));
  };

  const reorderTasks = (clientId: number, activeId: number, overId: number) => {
      setClients(prev => prev.map(c => {
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
      updateTaskPriority,
      updateTaskEffort,
      toggleTask,
      deleteTask,
      reorderTasks,
      toggleSound,
      exportData
    }
  };
}