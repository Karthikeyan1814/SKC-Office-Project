import axios from 'axios'
import { isTokenExpired, clearUserSession } from '../utils/tokenHelper'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 120000
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("skc-token");
    if (token) {
        // Pre-flight check: If 60-day token has expired client-side, auto logout immediately
        if (isTokenExpired(token)) {
            clearUserSession(true, "Your 60-day session has expired. You have been automatically logged out.");
            if (!window.location.pathname.toLowerCase().includes("/signin")) {
                window.location.href = "/SignIn";
            }
            return Promise.reject(new Error("Token expired"));
        }
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => {
        // Backend indicated token expired in headers
        if (response.headers && response.headers['x-token-expired'] === 'true') {
            clearUserSession(true, "Session expired (60-day limit). Please sign in again.");
            if (!window.location.pathname.toLowerCase().includes("/signin")) {
                window.location.href = "/SignIn";
            }
        }
        return response;
    },
    (error) => {
        if (error.response) {
            const isExpiredHeader = error.response.headers && error.response.headers['x-token-expired'] === 'true';
            const status = error.response.status;
            const token = localStorage.getItem("skc-token");

            // If 401 Unauthorized or expired token detected
            if (isExpiredHeader || status === 401 || (status === 403 && token && isTokenExpired(token))) {
                const hadToken = !!token;
                clearUserSession(hadToken, "Your session has expired. Please sign in again.");
                if (!window.location.pathname.toLowerCase().includes("/signin")) {
                    window.location.href = "/SignIn";
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;