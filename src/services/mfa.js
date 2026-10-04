// Verificação em duas etapas (TOTP) — CAD-169. Contrato: accounts/mfa_api.py no back (/api/v1/auth/mfa/)
import api from './api';

export const mfaApi = {
    status: () => api.get('auth/mfa/').then((r) => r.data),
    setup: () => api.post('auth/mfa/setup/').then((r) => r.data),
    confirm: (code) => api.post('auth/mfa/confirm/', { code: normalizeCode(code) }).then((r) => r.data),
    disable: (password, code) => api.post('auth/mfa/disable/', { password, code: normalizeCode(code) }).then((r) => r.data),
    recoveryCodes: (code) => api.post('auth/mfa/recovery-codes/', { code: normalizeCode(code) }).then((r) => r.data),
    verify: (mfaToken, code) => api.post('auth/mfa/verify/', { mfa_token: mfaToken, code: normalizeCode(code) }).then((r) => r.data),
};

// "123 456" → "123456"; código de recuperação ("ab12-cd34") passa como está, em minúsculas
export function normalizeCode(value) {
    const raw = String(value || '').trim();
    const digits = raw.replace(/\s/g, '');
    return /^\d+$/.test(digits) ? digits : raw.toLowerCase();
}

// QR em <img> (data URI): o SVG vem do nosso back, mas assim ele nunca é interpretado como HTML na página
export function svgDataUri(svg) {
    if (!svg) return '';
    const bytes = new TextEncoder().encode(svg);
    let binary = '';
    bytes.forEach((b) => { binary += String.fromCharCode(b); });
    return `data:image/svg+xml;base64,${btoa(binary)}`;
}

export function recoveryCodesText(codes, email) {
    return [
        'Cadrius — códigos de recuperação da verificação em duas etapas',
        email ? `Conta: ${email}` : '',
        'Cada código vale UMA vez. Guarde em local seguro (gerenciador de senhas).',
        '',
        ...(codes || []),
    ].filter((line, i) => line !== '' || i === 3).join('\n');
}

// Login social com MFA: o callback guarda o desafio e a tela de login pede o código
const PENDING_KEY = 'cadrius:mfa_pending';
export const pendingMfa = {
    save: (token) => { try { sessionStorage.setItem(PENDING_KEY, token); } catch { /* sem storage: volta ao login normal */ } },
    take: () => {
        try {
            const token = sessionStorage.getItem(PENDING_KEY);
            sessionStorage.removeItem(PENDING_KEY);
            return token;
        } catch {
            return null;
        }
    },
};
