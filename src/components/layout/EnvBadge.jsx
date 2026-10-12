import { currentEnv } from '../../services/environment';
import s from './SubscriptionBanner.module.css';

// Selo do ambiente: aparece só fora da produção, para ninguém confundir teste com dados reais
export default function EnvBadge() {
    const env = currentEnv();
    if (env === 'producao') return null;
    const label = env === 'teste' ? 'TESTE' : 'LOCAL';
    return (
        <span title="Ambiente de testes: dados e contas separados da produção" className={s.env_badge}>{label}</span>
    );
}
