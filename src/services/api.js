// src/services/api.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL; // ex.: https://api.cadrius.ia.br/api/v1/

// Origem do servidor (para rotas fora de /api/v1/, como /api/billing/...)
export const API_ORIGIN = (() => {
    try { return new URL(BASE_URL).origin; } catch { return ''; }
})();

const api = axios.create({
    baseURL: BASE_URL,
});

// Evento disparado quando o back responde 428 consent_required (termos novos a aceitar).
export const CONSENT_REQUIRED_EVENT = 'cadrius:consent-required';
// Evento disparado quando a sessão expirou de vez (refresh inválido).
export const SESSION_EXPIRED_EVENT = 'cadrius:session-expired';
export const PASSWORD_CHANGE_EVENT = 'cadrius:password-change-required';

// =============================
// INTERCEPTOR DE REQUEST
// =============================
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Uma única renovação de token por vez: várias requisições 401 simultâneas esperam a mesma promessa
// (com ROTATE_REFRESH_TOKENS/blacklist, usar o mesmo refresh duas vezes derrubaria a sessão).
let refreshPromise = null;

function refreshAccessToken() {
    if (!refreshPromise) {
        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) return Promise.reject(new Error('Refresh token não encontrado'));
        refreshPromise = axios
            .post(`${BASE_URL}auth/token/refresh/`, { refresh })
            .then((res) => {
                localStorage.setItem('access_token', res.data.access);
                if (res.data.refresh) localStorage.setItem('refresh_token', res.data.refresh);
                return res.data.access;
            })
            .finally(() => { refreshPromise = null; });
    }
    return refreshPromise;
}

// =============================
// INTERCEPTOR DE RESPONSE
// =============================
api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        // 428: o usuário precisa aceitar versões novas dos documentos legais (LGPD)
        if (status === 428 && error.response?.data?.code === 'consent_required') {
            window.dispatchEvent(new CustomEvent(CONSENT_REQUIRED_EVENT, { detail: error.response.data }));
            return Promise.reject(error);
        }

        // 403 password_change_required: senha temporária da TI (CAD-221) → recarrega o perfil e as rotas levam à troca
        if (status === 403 && error.response?.data?.code === 'password_change_required') {
            window.dispatchEvent(new Event(PASSWORD_CHANGE_EVENT));
            return Promise.reject(error);
        }

        // 401 em rota autenticada (não no login/refresh): tenta renovar o token uma vez
        if (
            status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('auth/token')
        ) {
            originalRequest._retry = true;

            try {
                const newAccessToken = await refreshAccessToken();
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                console.warn('Refresh falhou. Encerrando a sessão.');
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
