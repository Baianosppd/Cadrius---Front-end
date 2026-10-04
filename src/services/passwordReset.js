// Recuperação de senha (CAD-115). Contrato do back: accounts/password_reset.py
import api, { API_ORIGIN } from './api';

const BASE = `${API_ORIGIN}/api/v1/auth/password-reset/`;

export async function requestPasswordReset(email) {
    const { data } = await api.post(BASE, { email: String(email || '').trim() });
    return data;
}

export async function confirmPasswordReset({ uid, token, newPassword }) {
    const { data } = await api.post(`${BASE}confirm/`, { uid, token, new_password: newPassword });
    return data;
}

// O link do e-mail traz uid e token no *fragmento* (#uid=…&token=…): não vai ao servidor nem ao Referer.
export function parseResetFragment(hash = '') {
    if (!String(hash).startsWith('#')) return null; // só fragmento: token na query não é aceito
    const params = new URLSearchParams(String(hash).slice(1));
    const uid = params.get('uid');
    const token = params.get('token');
    return uid && token ? { uid, token } : null;
}

export function passwordResetError(err) {
    const d = err?.response?.data;
    if (err?.response?.status === 429) return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
    if (d?.code === 'invalid_token') return d.detail;
    if (Array.isArray(d?.new_password)) return d.new_password.join(' ');
    return d?.detail || 'Não foi possível concluir. Tente novamente.';
}
