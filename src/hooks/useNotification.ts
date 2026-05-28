import { useState, useCallback } from 'react';

interface Notification {
    type: 'error' | 'success';
    message: string;
}

interface UseNotificationReturn {
    notification: Notification | null;
    setNotification: (notif: Notification | null) => void;
    showNotification: (type: 'error' | 'success', message: string, duration?: number) => void;
    clearNotification: () => void;
}

/**
 * Custom hook for managing notification state
 * Provides auto-dismiss functionality for success messages
 */
export function useNotification(): UseNotificationReturn {
    const [notification, setNotification] = useState<Notification | null>(null);

    const showNotification = useCallback((type: 'error' | 'success', message: string, duration: number = 3000) => {
        setNotification({ type, message });

        if (type === 'success' && duration > 0) {
            setTimeout(() => setNotification(null), duration);
        }
    }, []);

    const clearNotification = useCallback(() => {
        setNotification(null);
    }, []);

    return {
        notification,
        setNotification,
        showNotification,
        clearNotification
    };
}
