/**
 * Hook for managing clients and tasks (CRUD operations).
 * Extracted from useZenData for better modularity and performance.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { BaseDirectory, readTextFile, writeTextFile, exists, mkdir } from '@tauri-apps/plugin-fs';
import { arrayMove } from '@dnd-kit/sortable';
import { DB_FILENAME, STORAGE_KEYS } from '../constants';
import type { Client, Task, Priority, Effort, Comment, NoteItem, DmcaProfile } from '../types';
import { logger } from '../utils';

// --- Type Guards & Normalization ---
const isRawTask = (t: unknown): t is Task => {
    if (typeof t !== 'object' || t === null) return false;
    const obj = t as Record<string, unknown>;
    return (
        typeof obj.id === 'number' &&
        typeof obj.title === 'string' &&
        typeof obj.isDone === 'boolean' &&
        obj.priority !== undefined &&
        obj.effort !== undefined
    );
};

export const normalizeClient = (v: unknown): Client | null => {
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
        targetCompletionDate: typeof obj.targetCompletionDate === 'number' ? obj.targetCompletionDate : undefined,
        dmcaProfile: obj.dmcaProfile as DmcaProfile | undefined
    };
};

interface UseClientsReturn {
    clients: Client[];
    clientsRef: React.RefObject<Client[]>;
    isLoaded: boolean;
    // Client actions
    addClient: (name: string, priority: Priority) => Client;
    removeClient: (id: number) => Client | null;
    updateClientPriority: (id: number, priority: Priority) => void;
    updateClientProfile: (clientId: number, profile: Partial<DmcaProfile>) => void;
    // Task actions
    addTask: (clientId: number, title: string, priority: Priority, effort: Effort) => Task | null;
    addTaskToMany: (clientIds: number[], title: string, priority: Priority, effort: Effort) => void;
    updateTaskTitle: (cId: number, tId: number, title: string) => void;
    updateTaskPriority: (cId: number, tId: number, priority: Priority) => void;
    updateTaskEffort: (cId: number, tId: number, effort: Effort) => void;
    updateTaskDueDate: (cId: number, tId: number, dueDate?: number) => void;
    addTaskComment: (cId: number, tId: number, text: string) => void;
    toggleTask: (cId: number, tId: number) => { task: Task; willBeDone: boolean } | null;
    deleteTask: (cId: number, tId: number) => Task | null;
    reorderTasks: (cId: number, activeId: number, overId: number) => void;
    // Note/Account actions
    addNote: (clientId: number, content: string) => void;
    deleteNote: (clientId: number, noteId: number) => void;
    updateNote: (clientId: number, noteId: number, content: string) => void;
    addAccount: (clientId: number, content: string) => void;
    deleteAccount: (clientId: number, accountId: number) => void;
    updateAccount: (clientId: number, accountId: number, content: string) => void;
    // Persistence
    exportData: () => void;
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
}

export function useClients(): UseClientsReturn {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const clientsRef = useRef(clients);

    const isSaving = useRef(false);
    const saveQueue = useRef<Client[] | null>(null);

    // Keep ref in sync
    useEffect(() => { clientsRef.current = clients; }, [clients]);

    // --- Initial Load ---
    useEffect(() => {
        const loadData = async () => {
            try {
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
                    logger.warn('FS access failed, falling back to localStorage');
                    const local = localStorage.getItem(STORAGE_KEYS.BACKUP_WEB);
                    if (local) {
                        loadedClients = (JSON.parse(local) as unknown[]).map(normalizeClient).filter((c): c is Client => c !== null);
                    }
                }

                setClients(loadedClients.sort((a, b) => a.id - b.id));
            } catch (e) {
                logger.error('Critical error loading data', e as Error);
            } finally {
                setIsLoaded(true);
            }
        };
        loadData();
    }, []);

    // --- Persistence ---
    const saveToDisk = useCallback(async (data: Client[]) => {
        if (isSaving.current) {
            saveQueue.current = data;
            return;
        }

        isSaving.current = true;
        try {
            const content = JSON.stringify(data, null, 2);
            try {
                await writeTextFile(DB_FILENAME, content, { baseDir: BaseDirectory.AppLocalData });
            } catch {
                localStorage.setItem(STORAGE_KEYS.BACKUP_WEB, content);
            }
        } catch (e) {
            logger.error('Save failed', e as Error);
        } finally {
            isSaving.current = false;
            if (saveQueue.current) {
                const nextData = saveQueue.current;
                saveQueue.current = null;
                saveToDisk(nextData);
            }
        }
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        const timer = setTimeout(() => saveToDisk(clients), 1000);
        return () => clearTimeout(timer);
    }, [clients, isLoaded, saveToDisk]);

    // --- Client Actions ---
    const addClient = useCallback((name: string, priority: Priority): Client => {
        const newClient: Client = {
            id: Date.now(),
            name: name.trim(),
            priority,
            notes: [],
            accounts: [],
            tasks: [],
            createdAt: Date.now()
        };
        setClients(prev => [...prev, newClient]);
        return newClient;
    }, []);

    const removeClient = useCallback((id: number): Client | null => {
        const client = clientsRef.current.find(c => c.id === id);
        if (client) {
            setClients(prev => prev.filter(c => c.id !== id));
        }
        return client || null;
    }, []);

    const updateClientPriority = useCallback((id: number, priority: Priority) => {
        setClients(prev => prev.map(c => c.id === id ? { ...c, priority } : c));
    }, []);

    const updateClientProfile = useCallback((clientId: number, profile: Partial<DmcaProfile>) => {
        const defaultProfile: DmcaProfile = { legalName: '', address: '', email: '', phone: '' };
        setClients(prev => prev.map(c =>
            c.id === clientId ? { ...c, dmcaProfile: { ...defaultProfile, ...c.dmcaProfile, ...profile } } : c
        ));
    }, []);

    // --- Task Actions ---
    const addTask = useCallback((clientId: number, title: string, priority: Priority, effort: Effort): Task | null => {
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
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, tasks: [newTask, ...c.tasks] } : c));
        return newTask;
    }, []);

    const addTaskToMany = useCallback((clientIds: number[], title: string, priority: Priority, effort: Effort) => {
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
    }, []);

    const updateTaskTitle = useCallback((cId: number, tId: number, title: string) => {
        setClients(prev => prev.map(c => c.id === cId ? {
            ...c, tasks: c.tasks.map(t => t.id === tId ? { ...t, title: title.trim() } : t)
        } : c));
    }, []);

    const updateTaskPriority = useCallback((cId: number, tId: number, priority: Priority) => {
        setClients(prev => prev.map(c => c.id === cId ? {
            ...c, tasks: c.tasks.map(t => t.id === tId ? { ...t, priority } : t)
        } : c));
    }, []);

    const updateTaskEffort = useCallback((cId: number, tId: number, effort: Effort) => {
        setClients(prev => prev.map(c => c.id === cId ? {
            ...c, tasks: c.tasks.map(t => t.id === tId ? { ...t, effort } : t)
        } : c));
    }, []);

    const updateTaskDueDate = useCallback((cId: number, tId: number, dueDate?: number) => {
        setClients(prev => prev.map(c => c.id === cId ? {
            ...c, tasks: c.tasks.map(t => t.id === tId ? { ...t, dueDate } : t)
        } : c));
    }, []);

    const addTaskComment = useCallback((cId: number, tId: number, text: string) => {
        const comment: Comment = { id: Date.now(), text: text.trim(), createdAt: Date.now(), author: 'You' };
        setClients(prev => prev.map(c => c.id === cId ? {
            ...c, tasks: c.tasks.map(t => t.id === tId ? { ...t, comments: [...t.comments, comment] } : t)
        } : c));
    }, []);

    const toggleTask = useCallback((cId: number, tId: number): { task: Task; willBeDone: boolean } | null => {
        const client = clientsRef.current.find(c => c.id === cId);
        const task = client?.tasks.find(t => t.id === tId);
        if (!task) return null;

        const willBeDone = !task.isDone;

        setClients(prev => prev.map(c => {
            if (c.id !== cId) return c;
            return {
                ...c,
                tasks: c.tasks.map(t => {
                    if (t.id !== tId) return t;
                    return {
                        ...t,
                        isDone: willBeDone,
                        completedAt: willBeDone ? Date.now() : undefined,
                    };
                })
            };
        }));

        return { task, willBeDone };
    }, []);

    const deleteTask = useCallback((cId: number, tId: number): Task | null => {
        const client = clientsRef.current.find(c => c.id === cId);
        const task = client?.tasks.find(t => t.id === tId);
        if (task) {
            setClients(prev => prev.map(c => c.id === cId ? { ...c, tasks: c.tasks.filter(t => t.id !== tId) } : c));
        }
        return task || null;
    }, []);

    const reorderTasks = useCallback((cId: number, activeId: number, overId: number) => {
        setClients(prev => prev.map(c => {
            if (c.id !== cId) return c;
            const oldIndex = c.tasks.findIndex(t => t.id === activeId);
            const newIndex = c.tasks.findIndex(t => t.id === overId);
            return { ...c, tasks: arrayMove(c.tasks, oldIndex, newIndex) };
        }));
    }, []);

    // --- Note/Account Actions ---
    const addNote = useCallback((clientId: number, content: string) => {
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, notes: [{ id: Date.now(), content, createdAt: Date.now() }, ...c.notes] } : c));
    }, []);

    const deleteNote = useCallback((clientId: number, noteId: number) => {
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, notes: c.notes.filter(n => n.id !== noteId) } : c));
    }, []);

    const updateNote = useCallback((clientId: number, noteId: number, content: string) => {
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, notes: c.notes.map(n => n.id === noteId ? { ...n, content } : n) } : c));
    }, []);

    const addAccount = useCallback((clientId: number, content: string) => {
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, accounts: [{ id: Date.now(), content, createdAt: Date.now() }, ...c.accounts] } : c));
    }, []);

    const deleteAccount = useCallback((clientId: number, accountId: number) => {
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, accounts: c.accounts.filter(a => a.id !== accountId) } : c));
    }, []);

    const updateAccount = useCallback((clientId: number, accountId: number, content: string) => {
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, accounts: c.accounts.map(a => a.id === accountId ? { ...a, content } : a) } : c));
    }, []);

    // --- Export ---
    const exportData = useCallback(() => {
        const blob = new Blob([JSON.stringify(clientsRef.current, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `zen_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    return {
        clients,
        clientsRef,
        isLoaded,
        setClients,
        addClient,
        removeClient,
        updateClientPriority,
        updateClientProfile,
        addTask,
        addTaskToMany,
        updateTaskTitle,
        updateTaskPriority,
        updateTaskEffort,
        updateTaskDueDate,
        addTaskComment,
        toggleTask,
        deleteTask,
        reorderTasks,
        addNote,
        deleteNote,
        updateNote,
        addAccount,
        deleteAccount,
        updateAccount,
        exportData,
    };
}
