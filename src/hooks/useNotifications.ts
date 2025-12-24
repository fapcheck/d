/**
 * Hook for managing system notifications with permission caching.
 * Extracted from useZenData for better modularity.
 */

import { useCallback, useRef } from 'react';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { logger } from '../utils';

type NotificationPermission = 'granted' | 'denied' | 'unknown';

interface UseNotificationsReturn {
    sendSystemNotification: (title: string, body?: string) => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
    const permissionState = useRef<NotificationPermission>('unknown');

    const sendSystemNotification = useCallback(async (title: string, body?: string) => {
        // Early exit if we know permission is denied
        if (permissionState.current === 'denied') return;

        try {
            // Check/request permission only if unknown
            if (permissionState.current === 'unknown') {
                let granted = await isPermissionGranted();
                if (!granted) {
                    const permission = await requestPermission();
                    granted = permission === 'granted';
                }
                permissionState.current = granted ? 'granted' : 'denied';
            }

            if (permissionState.current === 'granted') {
                sendNotification({
                    title: 'Zen Manager',
                    body: body || `Готово: ${title} 🎉`
                });
            }
        } catch (e) {
            logger.warn('Notification failed, disabling future attempts', e instanceof Error ? e : new Error(String(e)));
            permissionState.current = 'denied';
        }
    }, []);

    return { sendSystemNotification };
}
