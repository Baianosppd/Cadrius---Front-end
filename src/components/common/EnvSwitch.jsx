import { ENVIRONMENTS, currentEnv, switchUrl } from '../../services/environment';

// Seletor de ambiente no login (CAD-174): o escritório entra no app de produção ou no de teste por conta própria.
// São publicações separadas (contas e dados próprios); levamos só o e-mail digitado, nunca a senha.
export default function EnvSwitch({ email = '' }) {
    const env = currentEnv();
    const go = (target) => {
        if (target === env) return;
        const url = switchUrl(target, email.trim());
        if (url) window.location.assign(url);
    };
    const btn = (target) => {
        const active = target === env;
        return (
            <button key={target} type="button" role="radio" aria-checked={active} onClick={() => go(target)}
                style={{ flex: 1, border: 'none', borderRadius: 8, padding: '8px 10px', fontWeight: 600, fontSize: '.85rem', cursor: active ? 'default' : 'pointer',
                    background: active ? (target === 'teste' ? '#fef3c7' : '#fff') : 'transparent',
                    color: active ? (target === 'teste' ? '#92400e' : '#1d4ed8') : 'var(--c-muted)',
                    boxShadow: active ? '0 1px 2px rgba(0,0,0,.08)' : 'none' }}>
                {ENVIRONMENTS[target].label}
            </button>
        );
    };
    return (
        <div style={{ marginBottom: 20 }}>
            <div role="radiogroup" aria-label="Ambiente" style={{ display: 'flex', gap: 4, background: 'var(--c-surface-3)', borderRadius: 10, padding: 4 }}>
                {btn('producao')}{btn('teste')}
            </div>
            <p style={{ fontSize: '.78rem', color: 'var(--c-muted)', marginTop: 6, lineHeight: 1.4 }}>
                {env === 'teste'
                    ? 'Você está no ambiente de TESTE: dados fictícios e contas separadas da produção. Experimente à vontade.'
                    : 'O ambiente de teste tem contas e dados separados: use-o para experimentar sem afetar o escritório.'}
            </p>
        </div>
    );
}
