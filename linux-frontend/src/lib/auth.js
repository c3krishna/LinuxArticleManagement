import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { TOKEN_KEY, USER_KEY } from './api';

const AuthContext = createContext(null);

function readStoredUser() {
    try {
        return localStorage.getItem(TOKEN_KEY) ? JSON.parse(localStorage.getItem(USER_KEY) || 'null') : null;
    } catch {
        return null;
    }
}

// The stored user is only a hint for the first paint; /api/me is the source of truth for the role.
export function AuthProvider({ children }) {
    const [user, setUser] = useState(readStoredUser);
    const [checking, setChecking] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

    const saveUser = useCallback((next) => {
        if (next) localStorage.setItem(USER_KEY, JSON.stringify(next));
        else localStorage.removeItem(USER_KEY);
        setUser(next);
    }, []);

    useEffect(() => {
        if (!localStorage.getItem(TOKEN_KEY)) return;
        api.get('/api/me')
            .then((res) => saveUser(res.data.user))
            .catch(() => {
                localStorage.removeItem(TOKEN_KEY);
                saveUser(null);
            })
            .finally(() => setChecking(false));
    }, [saveUser]);

    const login = useCallback(async (email, password) => {
        const res = await api.post('/api/login', { email, password });
        localStorage.setItem(TOKEN_KEY, res.data.token);
        saveUser(res.data.user);
        return res.data.user;
    }, [saveUser]);

    const updateUser = useCallback((changes) => {
        setUser((current) => {
            const next = current ? { ...current, ...changes } : current;
            if (next) localStorage.setItem(USER_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        saveUser(null);
    }, [saveUser]);

    const value = useMemo(() => ({
        user,
        checking,
        isAdmin: user?.role === 'admin',
        login,
        logout,
        updateUser
    }), [user, checking, login, logout, updateUser]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
