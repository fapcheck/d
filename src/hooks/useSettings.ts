/**
 * Hook for managing application settings.
 * Extracted from useZenData for better modularity.
 * Handles settings persistence, sound toggle, and DMCA site/hosting management.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import type { AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

const STORAGE_KEY = 'zen_settings';

export function useSettings() {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const settingsRef = useRef(settings);

    // Keep ref in sync with state
    useEffect(() => { settingsRef.current = settings; }, [settings]);

    // Load settings from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    }, []);

    const actions = useMemo(() => ({
        toggleSound: () => {
            const current = settingsRef.current;
            const next = { ...current, soundEnabled: !current.soundEnabled };
            setSettings(next);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        },

        updateSettings: (newSettings: Partial<AppSettings>) => {
            setSettings(prev => {
                const next = { ...prev, ...newSettings };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                return next;
            });
        },

        // --- DMCA Site Management ---
        addDmcaSite: (site: string) => {
            setSettings(prev => {
                const currentSites = prev.dmcaSites || [];
                if (currentSites.includes(site)) return prev;
                const updated = { ...prev, dmcaSites: [...currentSites, site].sort() };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return updated;
            });
        },

        removeDmcaSite: (site: string) => {
            setSettings(prev => {
                const updated = { ...prev, dmcaSites: (prev.dmcaSites || []).filter(s => s !== site) };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return updated;
            });
        },

        renameDmcaSite: (oldName: string, newName: string) => {
            setSettings(prev => {
                const currentSites = prev.dmcaSites || [];
                const updatedSites = currentSites.map(s => s === oldName ? newName.trim() : s).sort();
                const updated = { ...prev, dmcaSites: updatedSites };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return updated;
            });
        },

        // --- DMCA Hosting Provider Management ---
        addDmcaHosting: (hosting: string) => {
            setSettings(prev => {
                const currentHostings = prev.dmcaHostings || [];
                if (currentHostings.includes(hosting)) return prev;
                const updated = { ...prev, dmcaHostings: [...currentHostings, hosting].sort() };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return updated;
            });
        },

        removeDmcaHosting: (hosting: string) => {
            setSettings(prev => {
                const updated = { ...prev, dmcaHostings: (prev.dmcaHostings || []).filter(h => h !== hosting) };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return updated;
            });
        },

        renameDmcaHosting: (oldName: string, newName: string) => {
            setSettings(prev => {
                const currentHostings = prev.dmcaHostings || [];
                const updatedHostings = currentHostings.map(h => h === oldName ? newName.trim() : h).sort();
                const updated = { ...prev, dmcaHostings: updatedHostings };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return updated;
            });
        },
    }), []);

    return {
        settings,
        setSettings, // Exposed for initial load override in useZenData
        settingsRef,
        ...actions,
    };
}
