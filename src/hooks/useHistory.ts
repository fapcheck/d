/**
 * Hook for managing undo/redo history.
 * Extracted from useZenData for better modularity.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Client, Task } from '../types';

export type HistoryEntryType =
    | 'client_add'
    | 'client_remove'
    | 'task_create'
    | 'task_delete'
    | 'task_complete';

export interface HistoryData {
    [key: string]: unknown;
}

export interface HistoryEntry {
    id: number;
    timestamp: number;
    type: HistoryEntryType;
    data: HistoryData | Client | Task;
    description: string;
    userId: string;
    clientId?: number;
    taskId?: number;
}

interface UseHistoryReturn {
    history: HistoryEntry[];
    historyIndex: number;
    addToHistory: (type: HistoryEntryType, description: string, data: HistoryData | Client | Task, clientId?: number, taskId?: number) => void;
    undo: () => HistoryEntry | null;
    redo: () => HistoryEntry | null;
    canUndo: () => boolean;
    canRedo: () => boolean;
    getHistory: () => HistoryEntry[];
}

const MAX_HISTORY_SIZE = 50;

export function useHistory(): UseHistoryReturn {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const historyRef = useRef(history);
    const historyIndexRef = useRef(historyIndex);

    useEffect(() => { historyRef.current = history; }, [history]);
    useEffect(() => { historyIndexRef.current = historyIndex; }, [historyIndex]);

    const addToHistory = useCallback((
        type: HistoryEntryType,
        description: string,
        data: HistoryData | Client | Task,
        clientId?: number,
        taskId?: number
    ) => {
        setHistory(prev => {
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
            // Truncate any "future" entries when adding new entry
            const newHistory = prev.slice(0, historyIndexRef.current + 1);
            newHistory.push(entry);
            return newHistory.slice(-MAX_HISTORY_SIZE);
        });
        setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY_SIZE - 1));
    }, []);

    const undo = useCallback((): HistoryEntry | null => {
        const idx = historyIndexRef.current;
        if (idx < 0) return null;
        const entry = historyRef.current[idx];
        setHistoryIndex(prev => Math.max(prev - 1, -1));
        return entry;
    }, []);

    const redo = useCallback((): HistoryEntry | null => {
        const idx = historyIndexRef.current;
        const hist = historyRef.current;
        if (idx >= hist.length - 1) return null;
        const entry = hist[idx + 1];
        setHistoryIndex(prev => Math.min(prev + 1, hist.length - 1));
        return entry;
    }, []);

    const canUndo = useCallback(() => historyIndexRef.current >= 0, []);
    const canRedo = useCallback(() => historyIndexRef.current < historyRef.current.length - 1, []);
    const getHistory = useCallback(() => historyRef.current, []);

    return {
        history,
        historyIndex,
        addToHistory,
        undo,
        redo,
        canUndo,
        canRedo,
        getHistory,
    };
}

/**
 * Apply a history entry to modify client state.
 * Returns a function that can be used to modify setClients.
 */
export function applyHistoryChange(
    entry: HistoryEntry,
    isUndo: boolean,
    setClients: React.Dispatch<React.SetStateAction<Client[]>>
): void {
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
            const data = entry.data as { isDone: boolean; completedAt?: number };
            const targetState = action === 'forward' ? data.isDone : !data.isDone;

            setClients(prev => prev.map(c => {
                if (c.id !== clientId) return c;
                return {
                    ...c,
                    tasks: c.tasks.map(t => {
                        if (t.id !== taskId) return t;
                        return { ...t, isDone: targetState, completedAt: targetState ? data.completedAt : undefined };
                    })
                };
            }));
            break;
        }
    }
}
