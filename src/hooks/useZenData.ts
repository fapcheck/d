import { useState, useEffect, useRef } from 'react';
import { writeTextFile, readTextFile, mkdir, exists, BaseDirectory } from '@tauri-apps/plugin-fs';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { DB_FILENAME } from '../types';
import type { Client, Task, Priority, Effort } from '../types';

export function useZenData() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // --- AUDIO & NOTIFICATIONS ---
  const playSound = () => {
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
    } catch (e) {
      console.error("Audio error", e);
    }
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
    } catch (e) {
      console.error("Notification error", e);
    }
  };

  // --- LOAD DATA ---
  useEffect(() => {
    async function loadData() {
      try {
        const dirExists = await exists('', { baseDir: BaseDirectory.AppLocalData });
        if (!dirExists) await mkdir('', { baseDir: BaseDirectory.AppLocalData, recursive: true });

        const fileExists = await exists(DB_FILENAME, { baseDir: BaseDirectory.AppLocalData });
        if (fileExists) {
          const content = await readTextFile(DB_FILENAME, { baseDir: BaseDirectory.AppLocalData });
          const parsed = JSON.parse(content);
          // Simple migration logic
          const migrated = parsed.map((c: any) => ({
            ...c,
            notes: c.notes || '',
            tasks: Array.isArray(c.tasks) ? c.tasks.map((t: any) => ({
              ...t,
              completedAt: (t.isDone && !t.completedAt) ? Date.now() : t.completedAt
            })) : []
          }));
          setClients(migrated);
        } else {
          const localSaved = localStorage.getItem('zenClients_v2');
          if (localSaved) setClients(JSON.parse(localSaved));
        }
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setIsLoaded(true);
      }
    }
    loadData();
  }, []);

  // --- SAVE DATA ---
  useEffect(() => {
    if (!isLoaded) return;
    const saveData = async () => {
      try {
        const json = JSON.stringify(clients);
        await writeTextFile(DB_FILENAME, json, { baseDir: BaseDirectory.AppLocalData });
        localStorage.setItem('zenClients_v2', json);
      } catch (err) {
        console.error("Save error:", err);
      }
    };
    const timeout = setTimeout(saveData, 500);
    return () => clearTimeout(timeout);
  }, [clients, isLoaded]);

  // --- ACTIONS ---
  const addClient = (name: string, priority: Priority) => {
    if (!name.trim()) return;
    const newClient: Client = {
      id: Date.now(),
      name,
      priority,
      notes: '',
      tasks: [],
    };
    setClients([...clients, newClient]);
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
    if (!title.trim()) return;
    const newTask: Task = {
      id: Date.now(),
      title,
      isDone: false,
      priority,
      effort,
      createdAt: Date.now(),
    };
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, tasks: [newTask, ...c.tasks] } : c));
  };

  const toggleTask = (clientId: number, taskId: number) => {
    setClients(prev => prev.map(client => {
      if (client.id !== clientId) return client;
      return {
        ...client,
        tasks: client.tasks.map(t => {
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
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, tasks: c.tasks.filter(t => t.id !== taskId) } : c));
  };

  return {
    clients,
    isLoaded,
    actions: {
      addClient,
      removeClient,
      updateClientPriority,
      updateClientNotes,
      addTask,
      toggleTask,
      deleteTask
    }
  };
}