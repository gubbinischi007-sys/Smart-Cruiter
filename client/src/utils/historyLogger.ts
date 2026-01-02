import { historyApi } from "../services/api";

export const logAction = (action: string) => {
    try {
        const lastLoginTime = localStorage.getItem('lastLoginTime');
        // Only log if we have an active session tracked
        if (lastLoginTime) {
            const history = JSON.parse(localStorage.getItem('loginHistory') || '[]');
            const activeSessionIndex = history.findIndex((h: any) => h.loginTime === lastLoginTime && h.logoutTime === null);

            if (activeSessionIndex !== -1) {
                if (!history[activeSessionIndex].actions) {
                    history[activeSessionIndex].actions = [];
                }
                history[activeSessionIndex].actions.push({
                    description: action,
                    timestamp: new Date().toISOString()
                });
                localStorage.setItem('loginHistory', JSON.stringify(history));
            }
        }
    } catch (e) {
        console.error('Failed to log action', e);
    }
};

export const logApplicationDecision = async (record: {
    name: string;
    email: string;
    job_title: string;
    status: 'Accepted' | 'Rejected';
    reason: string;
}) => {
    try {
        // 1. Save to Database (New Backend approach)
        await historyApi.create(record);

        // 2. Save to localStorage (Legacy/Redundancy approach)
        const existingHistory = JSON.parse(localStorage.getItem('applicationHistory') || '[]');
        const newRecord = {
            id: Math.random().toString(36).substr(2, 9),
            ...record,
            date: new Date().toISOString()
        };
        localStorage.setItem('applicationHistory', JSON.stringify([newRecord, ...existingHistory]));
    } catch (e) {
        console.error('Failed to log application decision', e);
    }
};
