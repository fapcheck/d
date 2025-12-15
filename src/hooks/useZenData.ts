import { useState, useEffect, useRef } from 'react';
import { openDB } from 'idb'; // Импортируем функцию
import type { IDBPDatabase } from 'idb'; // Импортируем тип отдельно
import { arrayMove } from '@dnd-kit/sortable';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { DEFAULT_SETTINGS } from '../types';
import type { Client, Task, Priority, Effort, AppSettings } from '../types';

const DB_NAME = 'zen-manager-db';
const STORE_NAME = 'clients';

export function useZenData() {
  const [clients, setClients] = useState<Client[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const dbRef = useRef<IDBPDatabase | null>(null);

  // --- AUDIO ---
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
      oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.1);
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

  // --- INIT ---
  useEffect(() => {
    // Настройки
    const localSettings = localStorage.getItem('zen_settings');
    if (localSettings) {
        setSettings(JSON.parse(localSettings));
    }

    // БД
    async function initDB() {
      try {
        dbRef.current = await openDB(DB_NAME, 1, {
          upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
          },
        });

        const allClients = await dbRef.current.getAll(STORE_NAME);
        allClients.sort((a, b) => a.id - b.id);
        
        if (allClients.length > 0) {
          setClients(allClients);
        } else {
           const localSaved = localStorage.getItem('zenClients_v2');
           if (localSaved) {
             const parsed = JSON.parse(localSaved);
             setClients(parsed);
             const tx = dbRef.current.transaction(STORE_NAME, 'readwrite');
             await Promise.all(parsed.map((c: any) => tx.store.put(c)));
             await tx.done;
           }
        }
      } catch (err) {
        console.error("IDB Init Error:", err);
      } finally {
        setIsLoaded(true);
      }
    }
    initDB();
  }, []);

  // --- DB HELPERS ---
  const saveClientToDb = async (client: Client) => {
    if (!dbRef.current) return;
    try { await dbRef.current.put(STORE_NAME, client); } catch (err) { console.error(err); }
  };

  const deleteClientFromDb = async (id: number) => {
    if (!dbRef.current) return;
    try { await dbRef.current.delete(STORE_NAME, id); } catch (err) { console.error(err); }
  };

  const updateClient = (clientId: number, updater: (c: Client) => Client) => {
      setClients(prev => prev.map(c => {
          if (c.id === clientId) {
              const updated = updater(c);
              saveClientToDb(updated);
              return updated;
          }
          return c;
      }));
  };

  // --- ACTIONS ---
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
    if (!name.trim()) return;
    const newClient: Client = { id: Date.now(), name, priority, notes: '', tasks: [] };
    setClients(prev => {
        const next = [...prev, newClient];
        saveClientToDb(newClient);
        return next;
    });
  };

  const removeClient = (id: number) => {
    setClients(prev => prev.filter(c => c.id !== id));
    deleteClientFromDb(id);
  };

  const updateClientPriority = (clientId: number, priority: Priority) => updateClient(clientId, c => ({ ...c, priority }));
  const updateClientNotes = (clientId: number, notes: string) => updateClient(clientId, c => ({ ...c, notes }));

  const addTask = (clientId: number, title: string, priority: Priority, effort: Effort) => {
    if (!title.trim()) return;
    const newTask: Task = { id: Date.now(), title, isDone: false, priority, effort, createdAt: Date.now() };
    updateClient(clientId, c => ({ ...c, tasks: [newTask, ...c.tasks] }));
  };

  const updateTaskTitle = (clientId: number, taskId: number, newTitle: string) => {
      if (!newTitle.trim()) return;
      updateClient(clientId, c => ({
          ...c,
          tasks: c.tasks.map(t => t.id === taskId ? { ...t, title: newTitle } : t)
      }));
  };

  const toggleTask = (clientId: number, taskId: number) => {
    updateClient(clientId, c => ({
        ...c,
        tasks: c.tasks.map(t => {
            if (t.id === taskId) {
                const willBeDone = !t.isDone;
                if (willBeDone) { playSound(); sendSystemNotification(t.title); }
                return { ...t, isDone: willBeDone, completedAt: willBeDone ? Date.now() : undefined };
            }
            return t;
        })
    }));
  };

  const deleteTask = (clientId: number, taskId: number) => updateClient(clientId, c => ({ ...c, tasks: c.tasks.filter(t => t.id !== taskId) }));

  const reorderTasks = (clientId: number, activeId: number, overId: number) => {
      setClients(prev => prev.map(c => {
          if (c.id === clientId) {
              const oldIndex = c.tasks.findIndex(t => t.id === activeId);
              const newIndex = c.tasks.findIndex(t => t.id === overId);
              if (oldIndex !== -1 && newIndex !== -1) {
                  const newTasks = arrayMove(c.tasks, oldIndex, newIndex);
                  const updatedClient = { ...c, tasks: newTasks };
                  saveClientToDb(updatedClient);
                  return updatedClient;
              }
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
      toggleTask,
      deleteTask,
      reorderTasks,
      toggleSound,
      exportData
    }
  };
}