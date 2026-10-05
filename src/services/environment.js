// Ambientes do Cadrius (CAD-174): produção (app) e teste (app-teste). São publicações separadas, com bases e contas próprias.
export const ENVIRONMENTS = {
    producao: { label: 'Produção', url: import.meta.env.VITE_APP_URL_PROD || 'https://app.cadrius.ia.br' },
    teste: { label: 'Teste', url: import.meta.env.VITE_APP_URL_TEST || 'https://app-teste.cadrius.ia.br' },
};

// Ambiente atual pelo endereço (ou VITE_APP_ENV em builds locais)
export function currentEnv(hostname = typeof window !== 'undefined' ? window.location.hostname : '') {
    const forced = import.meta.env.VITE_APP_ENV;
    if (/(^|\.)app-teste\./.test(hostname) || hostname.startsWith('app-teste')) return 'teste';
    if (hostname === 'localhost' || hostname === '127.0.0.1') return forced === 'production' ? 'producao' : 'local';
    if (forced === 'staging') return 'teste';
    return 'producao';
}

// URL do login do outro ambiente (mantém o e-mail digitado, se houver; nunca a senha)
export function switchUrl(target, email = '') {
    const base = ENVIRONMENTS[target]?.url;
    if (!base) return null;
    const url = new URL('/', base);
    if (email) url.searchParams.set('email', email);
    return url.toString();
}
