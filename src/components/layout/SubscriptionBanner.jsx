import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentPlan, getNotices, subscriptionNotice } from '../../services/billing';

const COLORS = {
    info: { background: 'var(--c-primary-50)', color: 'var(--c-primary-700)', border: 'var(--c-info-bd)' },
    warn: { background: 'var(--c-warning-bg)', color: 'var(--c-warning)', border: 'var(--c-warning-bd)' },
    danger: { background: 'var(--c-danger-bg)', color: 'var(--c-danger)', border: 'var(--c-danger-bd)' },
};

// Faixa no topo do app com o estado da assinatura (trial, cobrança pendente, IA pausada).
export default function SubscriptionBanner() {
    const [items, setItems] = useState([]);
    const [dismissed, setDismissed] = useState(() => {
        try { return JSON.parse(window.sessionStorage.getItem('cadrius:notices:dismissed') || '[]'); } catch { return []; }
    });

    useEffect(() => {
        let alive = true;
        Promise.all([getCurrentPlan().catch(() => null), getNotices().catch(() => [])]).then(([plan, notices]) => {
            if (!alive) return;
            const own = plan ? subscriptionNotice(plan.assinatura) : null;
            setItems([
                ...(own ? [{ id: 'estado', tone: own.tone, text: own.text, link: true }] : []),
                // informes do financeiro (segmentados no back por plano/estado/período); podem ser dispensados nesta sessão
                ...notices.map((n) => ({ id: `n${n.id}`, tone: n.severity, text: `${n.title}: ${n.body}`, dismissible: true })),
            ]);
        });
        return () => { alive = false; };
    }, []);

    const dismiss = (id) => {
        const next = [...dismissed, id];
        setDismissed(next);
        try { window.sessionStorage.setItem('cadrius:notices:dismissed', JSON.stringify(next)); } catch { /* sem storage */ }
    };

    const visible = items.filter((i) => !dismissed.includes(i.id));
    if (!visible.length) return null;
    return (
        <>
            {visible.map((item) => {
                const c = COLORS[item.tone] || COLORS.info;
                return (
                    <div key={item.id} role="status" style={{ background: c.background, color: c.color, borderBottom: `1px solid ${c.border}`, padding: '10px 24px', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <span>{item.text} {item.link && <Link to="/perfil?aba=plano" style={{ color: 'inherit', fontWeight: 600 }}>Ver plano</Link>}</span>
                        {item.dismissible && <button type="button" aria-label="Dispensar aviso" onClick={() => dismiss(item.id)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>}
                    </div>
                );
            })}
        </>
    );
}
