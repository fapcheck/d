/**
 * Hook for managing application settings.
 * Extracted from useZenData for better modularity.
 * Handles settings persistence, sound toggle, and DMCA site/hosting management.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { logger, validateNonEmptyString } from '../utils';
import { STORAGE_KEYS } from '../constants';

const STORAGE_KEY = STORAGE_KEYS.SETTINGS;

export function useSettings() {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
    const settingsRef = useRef(settings);

    // Keep ref in sync with state
    useEffect(() => { settingsRef.current = settings; }, [settings]);

    // Helper to persist settings to localStorage
    const persistSettings = useCallback((updater: (prev: AppSettings) => AppSettings) => {
        setSettings(prev => {
            const updated = updater(prev);
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch (e) {
                logger.error('Failed to save settings to localStorage', e as Error);
            }
            return updated;
        });
    }, []);

    // Load settings from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
            }
        } catch (e) {
            logger.error('Failed to load settings from localStorage. Using defaults.', e as Error);
        } finally {
            setIsSettingsLoaded(true);
        }
    }, []);

    const actions = useMemo(() => ({
        toggleSound: () => {
            const current = settingsRef.current;
            persistSettings(() => ({ ...current, soundEnabled: !current.soundEnabled }));
        },

        updateSettings: (newSettings: Partial<AppSettings>) => {
            persistSettings(prev => ({ ...prev, ...newSettings }));
        },

        // --- DMCA Site Management ---
        addDmcaSite: (site: string) => {
            const validSite = validateNonEmptyString(site);
            if (!validSite) {
                logger.warn('Attempted to add empty DMCA site');
                return;
            }

            persistSettings(prev => {
                const currentSites = prev.dmcaSites || [];
                if (currentSites.includes(validSite)) return prev;
                return { ...prev, dmcaSites: [...currentSites, validSite].sort() };
            });
        },

        removeDmcaSite: (site: string) => {
            persistSettings(prev => ({
                ...prev,
                dmcaSites: (prev.dmcaSites || []).filter(s => s !== site)
            }));
        },

        renameDmcaSite: (oldName: string, newName: string) => {
            const validNewName = validateNonEmptyString(newName);
            if (!validNewName) {
                logger.warn('Attempted to rename DMCA site with empty name');
                return;
            }

            persistSettings(prev => {
                const currentSites = prev.dmcaSites || [];
                const updatedSites = currentSites.map(s => s === oldName ? validNewName : s).sort();
                return { ...prev, dmcaSites: updatedSites };
            });
        },

        // --- DMCA Hosting Provider Management ---
        addDmcaHosting: (hosting: string) => {
            const validHosting = validateNonEmptyString(hosting);
            if (!validHosting) {
                logger.warn('Attempted to add empty DMCA hosting');
                return;
            }

            persistSettings(prev => {
                const currentHostings = prev.dmcaHostings || [];
                if (currentHostings.includes(validHosting)) return prev;
                return { ...prev, dmcaHostings: [...currentHostings, validHosting].sort() };
            });
        },

        removeDmcaHosting: (hosting: string) => {
            persistSettings(prev => ({
                ...prev,
                dmcaHostings: (prev.dmcaHostings || []).filter(h => h !== hosting)
            }));
        },

        renameDmcaHosting: (oldName: string, newName: string) => {
            const validNewName = validateNonEmptyString(newName);
            if (!validNewName) {
                logger.warn('Attempted to rename DMCA hosting with empty name');
                return;
            }

            persistSettings(prev => {
                const currentHostings = prev.dmcaHostings || [];
                const updatedHostings = currentHostings.map(h => h === oldName ? validNewName : h).sort();
                return { ...prev, dmcaHostings: updatedHostings };
            });
        },
    }), [persistSettings]);

    return {
        settings,
        isSettingsLoaded,
        setSettings, // Exposed for initial load override in useZenData
        settingsRef,
        ...actions,
    };
}
