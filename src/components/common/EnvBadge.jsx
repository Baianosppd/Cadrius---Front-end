import { currentEnv } from '../../services/environment';

// Selo do ambiente: aparece só fora da produção, para ninguém confundir teste com dados reais
export default function EnvBadge() {
    const env = currentEnv();
    if (env === 'producao') return null;
    const label = env === 'teste' ? 'TESTE' : 'LOCAL';
    return (
        <span title="Ambiente de testes: dados e contas separados da produção"
            style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: 999, fontSize: '.65rem',
                fontWeight: 800, padding: '2px 8px', letterSpacing: '.06em' }}>{label}</span>
    );
}
