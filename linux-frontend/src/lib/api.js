import axios from 'axios';

export const TOKEN_KEY = 'token';
export const USER_KEY = 'user';

const api = axios.create();

api.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// A 401 means the session is gone (expired, user disabled or deleted): clear it and go to login.
// Login itself returns 401 for bad credentials, so it is excluded.
api.interceptors.response.use(
    (res) => res,
    (err) => {
        const url = err.config?.url || '';
        if (err.response?.status === 401 && localStorage.getItem(TOKEN_KEY) && !url.endsWith('/api/login')) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            const next = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.assign(`/login?expired=1&next=${next}`);
        }
        return Promise.reject(err);
    }
);

export function errorMessage(err, fallback = 'Something went wrong. Please try again') {
    return err?.response?.data?.message || fallback;
}

export default api;
