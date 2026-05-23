// src/services/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/v1/',
});

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


// =============================
// INTERCEPTOR DE RESPONSE
// =============================
api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;

        // --- ALTERAÇÃO AQUI ---
        // Verifica se é erro 401
        // E certifica que NÃO é a rota de login (token)
        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes('/auth/token/') // Não tenta refresh se for login!
        ) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');

                if (!refreshToken) {
                    throw new Error("Refresh token não encontrado");
                }

                const response = await axios.post(
                    'http://127.0.0.1:8000/api/v1/auth/token/refresh/',
                    { refresh: refreshToken }
                );

                const newAccessToken = response.data.access;
                localStorage.setItem('access_token', newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);

            } catch (refreshError) {
                console.warn("Refresh falhou. Fazendo logout...");
                localStorage.clear();
                if (window.location.pathname !== '/') {
                    window.location.href = '/';
                }
                return Promise.reject(refreshError);
            }
        }

        // Se for erro de login (401 na rota /auth/token/), 
        // ele vai cair direto aqui e o seu Login.jsx vai pegar no catch!
        return Promise.reject(error);
    }
);

export default api;
