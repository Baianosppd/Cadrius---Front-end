import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { SiTelegram, SiTrello, SiWhatsapp, SiClickup, SiGooglesheets } from 'react-icons/si';
import { FiLink, FiFileText } from 'react-icons/fi';
import api from '../../services/api.js';
import styles from './Integracoes.module.css';
import PageHeader from '../../components/ui/PageHearder.jsx';
import IntegrationGrid from '../../components/ui/Cards/IntegrationGrid.jsx';
import SyncHistory from '../../components/ui/SyncHistory.jsx';
import ConnectionModal from '../../components/common/ConnectionModal.jsx';
import GoogleCalendarCard from '../../components/common/GoogleCalendarCard.jsx';
import { CONNECTION_APPS } from '../../services/connections';
import { errorMessage } from '../../components/seguranca/ui';

const LOGOS = {
    WHATSAPP: [SiWhatsapp, '#25d366', '#f0fdf4'], TELEGRAM: [SiTelegram, '#229ed9', '#eff6ff'],
    TRELLO: [SiTrello, '#0079bf', '#eff6ff'], CLICKUP: [SiClickup, '#7b68ee', '#f5f3ff'],
    SHEETS: [SiGooglesheets, '#0f9d58', '#f0fdf4'], ASTREA: ['A', null, '#3b82f6'], WEBHOOK: [FiLink, '#374151', '#f3f4f6'],
};

function Integracoes() {
    const [connections, setConnections] = useState([]);
    const [history, setHistory] = useState([]);
    const [modalApp, setModalApp] = useState(null);

    const load = useCallback(() => {
        api.get('connections/').then((r) => setConnections(r.data)).catch(() => setConnections([]));
        api.get('sync-history/', { params: { page_size: 10 } })
            .then((r) => setHistory((r.data.results ?? r.data).map((h) => ({
                name: h.integration, description: h.description, time: h.time, status: h.status === 'sucesso' ? 'sucesso' : 'erro',
            }))))
            .catch(() => setHistory([]));
    }, []);
    useEffect(() => { load(); }, [load]);

    const remove = async (conn) => {
        if (!window.confirm(`Remover a conexão "${conn.name}"? Automações que a usam deixarão de funcionar.`)) return;
        try { await api.delete(`connections/${conn.id}/`); toast.success('Conexão removida.'); load(); }
        catch (err) { toast.error(errorMessage(err)); }
    };

    const integrations = Object.entries(CONNECTION_APPS).map(([key, app]) => {
        const mine = connections.filter((c) => c.app_name === key);
        const [logo, logoColor, logoBg] = LOGOS[key] || [FiFileText, '#374151', '#f3f4f6'];
        return {
            name: app.label,
            status: mine.length ? 'conectado' : 'desconectado',
            description: app.description,
            syncInfo: mine.length ? `${mine.length} conexão(ões): ${mine.map((c) => c.name).join(', ')}` : null,
            logo, logoColor, logoBg,
            onAction: () => (mine.length && !window.confirm(`Já existe conexão com ${app.label}. Adicionar outra? (Para remover, use o botão abaixo.)`) ? null : setModalApp(key)),
        };
    });

    return (
        <div className={styles.integracoes_container}>
            <PageHeader title="Integrações" subtitle="Conecte suas ferramentas favoritas ao Cadrius" />
            <GoogleCalendarCard />
            <IntegrationGrid integrations={integrations} />
            {connections.length > 0 && (
                <div style={{ margin: '16px 0' }}>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 8 }}>Suas conexões</h2>
                    {connections.map((c) => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 6 }}>
                            <span>{c.name} <small style={{ color: '#6b7280' }}>({c.app_label})</small></span>
                            <button onClick={() => remove(c)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Remover</button>
                        </div>
                    ))}
                </div>
            )}
            <SyncHistory history={history} />
            {modalApp && <ConnectionModal appKey={modalApp} onClose={() => setModalApp(null)} onSaved={load} />}
        </div>
    );
}

export default Integracoes;
