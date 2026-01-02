import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { notificationsApi } from '../services/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
    unreadCount: number;
    refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshUnreadCount = useCallback(async () => {
        if (!user || !user.email) return;

        try {
            const response = await notificationsApi.getUnreadCount(user.email);
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error('Failed to fetch unread count', error);
        }
    }, [user]);

    // Initial fetch and polling
    useEffect(() => {
        if (user && user.email) {
            refreshUnreadCount();
            // Poll every 10 seconds as a fallback, but rely mostly on manual execution
            const interval = setInterval(refreshUnreadCount, 10000);
            return () => clearInterval(interval);
        } else {
            setUnreadCount(0);
        }
    }, [user, refreshUnreadCount]);

    return (
        <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}
