// Regras dos gráficos da Cibersegurança (CAD-221) — funções puras, testáveis
import { FiAlertOctagon, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

export function niceMax(v) {
    if (v <= 4) return 4;
    const p = 10 ** Math.floor(Math.log10(v));
    const n = v / p;
    return (n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

export function levelOf(pct, warn = 70, crit = 85) {
    return pct >= crit ? 'crit' : pct >= warn ? 'warn' : 'ok';
}

export function scoreLevel(n) {
    return n >= 85 ? { label: 'Saudável', tone: 'good', Icon: FiCheckCircle }
        : n >= 60 ? { label: 'Atenção', tone: 'warn', Icon: FiAlertTriangle }
            : { label: 'Crítico', tone: 'crit', Icon: FiAlertOctagon };
}
