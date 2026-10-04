import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentPlan, subscriptionNotice } from '../../services/billing';

const COLORS = {
    info: { background: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
    warn: { background: '#fffbeb', color: '#92400e', border: '#fde68a' },
    danger: { background: '#fef2f2', color: '#991b1b', border: '#fecaca' },
};

// Faixa no topo do app com o estado da assinatura (trial, cobrança pendente, IA pausada).
export default function SubscriptionBanner() {
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        let alive = true;
        getCurrentPlan()
            .then((data) => { if (alive) setNotice(subscriptionNotice(data.assinatura)); })
            .catch(() => { /* sem escritório (equipe) ou sem rede: não mostra nada */ });
        return () => { alive = false; };
    }, []);

    if (!notice) return null;
    const c = COLORS[notice.tone];
    return (
        <div role="status" style={{ background: c.background, color: c.color, borderBottom: `1px solid ${c.border}`, padding: '10px 24px', fontSize: '0.875rem' }}>
            {notice.text} <Link to="/perfil" style={{ color: 'inherit', fontWeight: 600 }}>Ver plano</Link>
        </div>
    );
}
