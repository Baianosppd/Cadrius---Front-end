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

        // Verifica se é erro 401 e se ainda não tentou retry
        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');

                if (!refreshToken) {
                    throw new Error("Refresh token não encontrado");
                }

                // Faz requisição para renovar o token
                const response = await axios.post(
                    'http://127.0.0.1:8000/api/v1/auth/token/refresh/',
                    { refresh: refreshToken }
                );

                const newAccessToken = response.data.access;

                // Salva novo access_token
                localStorage.setItem('access_token', newAccessToken);

                // Atualiza header da requisição original
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                // Refaz a requisição original
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

        return Promise.reject(error);
    }
);

export default api;
