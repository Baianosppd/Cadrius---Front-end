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

// CAD-232: o refresh token agora é renovado a cada uso (sessão de 30 dias com "Manter conectado"). Com várias abas
// abertas, duas abas renovando juntas derrubariam a sessão: a trava do navegador (Web Locks) deixa uma de cada vez, e
// quem chega depois aproveita o token que a outra aba acabou de gravar.
async function doRefresh(usedRefresh) {
    const current = localStorage.getItem('refresh_token');
    if (!current) throw new Error('Refresh token não encontrado');
    if (current !== usedRefresh && localStorage.getItem('access_token')) return localStorage.getItem('access_token');
    const res = await axios.post(`${BASE_URL}auth/token/refresh/`, { refresh: current });
    localStorage.setItem('access_token', res.data.access);
    if (res.data.refresh) localStorage.setItem('refresh_token', res.data.refresh);
    return res.data.access;
}

function refreshAccessToken() {
    if (!refreshPromise) {
        const usedRefresh = localStorage.getItem('refresh_token');
        if (!usedRefresh) return Promise.reject(new Error('Refresh token não encontrado'));
        const run = () => doRefresh(usedRefresh);
        refreshPromise = (navigator.locks?.request ? navigator.locks.request('cadrius-refresh', run) : run())
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
