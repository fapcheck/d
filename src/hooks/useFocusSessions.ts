/**
 * Hook for managing focus sessions.
 * Extracted from useZenData for better modularity.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { STORAGE_KEYS } from '../constants';
import { logger } from '../utils';
import type { FocusSession, Client } from '../types';

// --- Helper: Normalize FocusSession ---
const normalizeFocusSession = (raw: unknown): FocusSession | null => {
    if (!raw || typeof raw !== 'object') return null;
    const obj = raw as Record<string, unknown>;

    if (obj.id === undefined || obj.clientId === undefined ||
        typeof obj.startTime !== 'number' || typeof obj.duration !== 'number') {
        return null;
    }

    return {
        id: obj.id as number | string,
        clientId: obj.clientId as number | string,
        taskId: obj.taskId as number | string | undefined,
        startTime: obj.startTime,
        endTime: typeof obj.endTime === 'number' ? obj.endTime : undefined,
        duration: obj.duration,
        wasCompleted: typeof obj.wasCompleted === 'boolean' ? obj.wasCompleted : false
    };
};

interface UseFocusSessionsReturn {
    focusSessions: FocusSession[];
    startFocusSession: (data: Omit<FocusSession, 'id' | 'duration'>) => number;
    endFocusSession: (id: number, wasCompleted: boolean) => void;
}

export function useFocusSessions(isLoaded: boolean): UseFocusSessionsReturn {
    const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
    const isInitialized = useRef(false);

    // Load from localStorage on mount
    useEffect(() => {
        if (isInitialized.current) return;
        isInitialized.current = true;

        try {
            const localSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
            if (localSessions) {
                const parsed = JSON.parse(localSessions) as unknown[];
                const normalized = parsed.map(normalizeFocusSession).filter((s): s is FocusSession => s !== null);
                setFocusSessions(normalized);
            }
        } catch (e) {
            logger.error('Failed to load focus sessions', e as Error);
        }
    }, []);

    // Persist to localStorage when changed
    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(focusSessions));
    }, [focusSessions, isLoaded]);

    const startFocusSession = useCallback((data: Omit<FocusSession, 'id' | 'duration'>): number => {
        const id = Date.now();
        setFocusSessions(prev => [...prev, { ...data, id, duration: 0 }]);
        return id;
    }, []);

    const endFocusSession = useCallback((id: number, wasCompleted: boolean) => {
        setFocusSessions(prev => prev.map(s => {
            if (s.id !== id) return s;
            const endTime = Date.now();
            return { ...s, endTime, duration: Math.floor((endTime - s.startTime) / 1000), wasCompleted };
        }));
    }, []);

    return {
        focusSessions,
        startFocusSession,
        endFocusSession,
    };
}
