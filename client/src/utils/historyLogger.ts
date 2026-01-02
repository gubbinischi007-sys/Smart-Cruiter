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
