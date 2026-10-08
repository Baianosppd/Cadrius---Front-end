import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiCheckCircle, FiExternalLink, FiX } from 'react-icons/fi';
import { SiGoogle } from 'react-icons/si';
import styles from '../../components/seguranca/seguranca.module.css';
import { Banner, Empty, errorMessage, Loading, PageHeader, Pill } from '../../components/seguranca/ui';
import useAuth from '../../hooks/useAuth';
import useLoader from '../gestao/useLoader';
import GoogleCalendarCard from '../../components/common/GoogleCalendarCard.jsx';
import WhatsAppCard from '../../components/common/WhatsAppCard.jsx';
import SyncHistory from '../../components/ui/SyncHistory.jsx';
import AppLogo from '../../components/common/AppLogo.jsx';
import api from '../../services/api';
import { groupByCategory, integrationsApi, missingFields } from '../../services/integrations';
import { gcal } from '../../services/gcal';
import { whatsappApi } from '../../services/whatsapp';

// Conectar um app (CAD-174): formulário à esquerda, guia "onde pegar cada dado" à direita (embaixo no celular)
function Conectar({ app, onClose, onSaved }) {
    const [name, setName] = useState(app.label);
    const [values, setValues] = useState({});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const submit = async (e) => {
        e.preventDefault();
        const missing = missingFields(app, values);
        if (missing.length) { setError(`Preencha: ${missing.join(', ')}.`); return; }
        setBusy(true); setError('');
        try {
            const conn = await integrationsApi.create({ name: name.trim(), app_name: app.app, credentials: values });
            toast.success('Conexão salva. Testando…');
            onSaved(conn);
        } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
    };
    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="conn-title" onClick={onClose}>
            <div className={styles.modal} style={{ maxWidth: 920 }} onClick={(e) => e.stopPropagation()}>
                <h2 id="conn-title" className={styles.modal_title}>Conectar {app.label}</h2>
                <p className={styles.muted} style={{ fontSize: '.88rem' }}>{app.uso}</p>
                <div className={styles.two_col}>
                    <form className={styles.stack} onSubmit={submit} autoComplete="off">
                        <label className={styles.field}>Nome da conexão
                            <input className={styles.input} value={name} maxLength={100} onChange={(e) => setName(e.target.value)} required />
                        </label>
                        {app.campos.map((f) => (
                            <label key={f.key} className={styles.field}>{f.label}{f.required && ' *'}
                                <input className={styles.input} type={f.secret ? 'password' : 'text'} autoComplete="off" placeholder={f.placeholder}
                                    value={values[f.key] || ''} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
                            </label>
                        ))}
                        <Banner tone="info">Credenciais ficam cifradas e não aparecem de novo depois de salvas.</Banner>
                        {error && <Banner tone="error">{error}</Banner>}
                        <div className={styles.btn_row}>
                            <button className={`${styles.btn} ${styles.btn_primary}`} disabled={busy}>{busy ? 'Salvando…' : 'Salvar e testar'}</button>
                            <button type="button" className={styles.btn} onClick={onClose}>Cancelar</button>
                        </div>
                    </form>
                    <div className={styles.card} style={{ background: 'var(--c-surface-2)' }}>
                        <div className={styles.section_title}>Onde pegar cada dado</div>
                        <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '.88rem', color: 'var(--c-text-2)' }}>
                            {app.guia.map((g, i) => <li key={i}>{g}</li>)}
                        </ol>
                        {app.links.length > 0 && (
                            <div className={styles.btn_row} style={{ marginTop: 12 }}>
                                {app.links.map((l) => (
                                    <a key={l.url} href={l.url} target="_blank" rel="noreferrer noopener" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_ghost}`}>
                                        {l.label} <FiExternalLink aria-hidden="true" />
                                    </a>
                                ))}
                            </div>
                        )}
                        {app.validar && <p className={styles.muted} style={{ fontSize: '.8rem', marginTop: 10 }}>Atenção: {app.validar}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Janela de um conector "da casa" (Google, WhatsApp do escritório): o conteúdo completo fica aqui, não na página.
function Painel({ title, onClose, children }) {
    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
            <div className={styles.modal} style={{ maxWidth: 920 }} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header_row} style={{ alignItems: 'center' }}>
                    <h2 className={styles.modal_title} style={{ margin: 0 }}>{title}</h2>
                    <button type="button" className={`${styles.btn} ${styles.btn_ghost}`} onClick={onClose} aria-label="Fechar"><FiX aria-hidden="true" /></button>
                </div>
                {children}
            </div>
        </div>
    );
}

// Cartão de conector: logo, nome, estado e uma linha do que faz. Mesmo formato para todos.
function ConnectorCard({ logo, title, status, uso, children }) {
    return (
        <div className={`${styles.card} ${styles.stack}`} style={{ gap: 10 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {logo}
                <div style={{ minWidth: 0 }}>
                    <strong>{title}</strong>
                    <div>{status}</div>
                </div>
            </div>
            <p className={`${styles.muted} ${styles.clamp2}`} style={{ fontSize: '.85rem', flex: 1, margin: 0 }}>{uso}</p>
            {children}
        </div>
    );
}

const GoogleLogo = () => (
    <span aria-hidden="true" style={{ width: 40, height: 40, borderRadius: 10, display: 'grid', placeItems: 'center', background: '#fff', border: '1px solid var(--c-border)', flexShrink: 0 }}>
        <SiGoogle size={20} color="#4285F4" />
    </span>
);

export default function Integracoes() {
    const { role } = useAuth();
    const canWrite = role !== 'VIEWER';
    const { data, error, reload } = useLoader(() => Promise.all([integrationsApi.catalog(), integrationsApi.connections(),
        api.get('sync-history/', { params: { page_size: 10 } }).then((r) => r.data).catch(() => []),
        gcal.status().catch(() => null), whatsappApi.status().catch(() => null)]), []);
    const [query, setQuery] = useState('');
    const [cat, setCat] = useState('');
    const [connecting, setConnecting] = useState(null);
    // Volta do Google (?gcal=…) abre direto a janela do Google, onde o resultado aparece
    const [open, setOpen] = useState(() => (new URLSearchParams(window.location.search).get('gcal') ? 'google' : ''));
    const [tests, setTests] = useState({});
    const test = async (conn) => {
        setTests((t) => ({ ...t, [conn.id]: { busy: true } }));
        try {
            const r = await integrationsApi.test(conn.id);
            setTests((t) => ({ ...t, [conn.id]: r }));
            (r.ok ? toast.success : toast.error)(r.mensagem);
        } catch (err) { setTests((t) => ({ ...t, [conn.id]: { ok: false, mensagem: errorMessage(err) } })); }
    };
    const remove = async (conn) => {
        if (!window.confirm(`Remover a conexão "${conn.name}"? Automações que a usam deixarão de funcionar.`)) return;
        try { await integrationsApi.remove(conn.id); toast.success('Conexão removida.'); reload(); } catch (err) { toast.error(errorMessage(err)); }
    };
    if (error) return <div className={styles.page}><Banner tone="error">{error}</Banner></div>;
    const [catalog, connections, historyRaw, gst, wst] = data || [{ apps: [], categorias: [] }, [], [], null, null];
    const history = (historyRaw?.results ?? historyRaw ?? []).map((h) => ({ name: h.integration, description: h.description, time: h.time, status: h.status === 'sucesso' ? 'sucesso' : 'erro' }));
    const byApp = (app) => connections.filter((c) => c.app_name === app);
    const connected = new Set(connections.map((c) => c.app_name));
    const groups = groupByCategory(catalog, query)
        .map((g) => (cat === '__on' ? { ...g, apps: g.apps.filter((a) => connected.has(a.app)) } : g))
        .filter((g) => g.apps.length && (!cat || cat === '__on' || g.categoria === cat));
    const counts = Object.fromEntries((catalog.categorias || []).map((c) => [c, catalog.apps.filter((a) => a.categoria === c).length]));
    const googleOn = gst?.connected && gst?.status === 'active';
    const waOn = !!wst?.conectado;
    const q = query.trim().toLowerCase();
    const showGoogle = gst && (!q || 'google agenda planilhas documentos calendar sheets docs'.includes(q)) && (cat === '' || (cat === '__on' && googleOn));
    const showWa = wst?.disponivel && (!q || 'whatsapp mensagens'.includes(q)) && (cat === '' || (cat === '__on' && waOn));
    const nConnected = connected.size + (googleOn ? 1 : 0) + (waOn ? 1 : 0);
    const closePanel = () => { setOpen(''); reload(); };

    // CAD-231: a tela só tem conectores. Google e WhatsApp do escritório são cartões como os outros (o detalhe abre numa janela);
    // o histórico de envios fica recolhido no fim.
    return (
        <div className={styles.page}>
            <PageHeader title="Integrações" />
            <div className={styles.header_row} style={{ alignItems: 'center', gap: 12 }}>
                <div className={styles.btn_row} role="group" aria-label="Categorias" style={{ gap: 6 }}>
                    <button type="button" className={`${styles.chip} ${!cat ? styles.chip_active : ''}`} aria-pressed={!cat} onClick={() => setCat('')}>Todos</button>
                    {nConnected > 0 && (
                        <button type="button" className={`${styles.chip} ${cat === '__on' ? styles.chip_active : ''}`} aria-pressed={cat === '__on'}
                            onClick={() => setCat(cat === '__on' ? '' : '__on')}>Conectados <span className={styles.muted}>{nConnected}</span></button>
                    )}
                    {(catalog.categorias || []).map((c) => (
                        <button key={c} type="button" className={`${styles.chip} ${cat === c ? styles.chip_active : ''}`} aria-pressed={cat === c}
                            onClick={() => setCat(cat === c ? '' : c)}>{c} <span className={styles.muted}>{counts[c]}</span></button>
                    ))}
                </div>
                <input className={styles.input} style={{ maxWidth: 300 }} value={query} onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar app" aria-label="Buscar app" />
            </div>
            {!data && <Loading />}

            {(showGoogle || showWa) && (
                <section className={styles.stack} aria-label="Principais">
                    {!cat && <div className={styles.section_title} style={{ marginBottom: 0 }}>Principais</div>}
                    <div className={styles.card_grid}>
                        {showGoogle && (
                            <ConnectorCard logo={<GoogleLogo />} title="Google"
                                status={googleOn ? <Pill tone="green">conectado</Pill> : gst.status === 'needs_reauth' ? <Pill tone="yellow">reconectar</Pill> : null}
                                uso="Agenda, Planilhas e Documentos numa conexão só, na sua própria conta.">
                                <button type="button" className={styles.btn} onClick={() => setOpen('google')}>{googleOn ? 'Gerenciar' : 'Conectar'}</button>
                            </ConnectorCard>
                        )}
                        {showWa && (
                            <ConnectorCard logo={<AppLogo app="WHATSAPP" label="WhatsApp" />} title="WhatsApp do escritório"
                                status={waOn ? <Pill tone="green">conectado</Pill> : null}
                                uso="O número do escritório envia os avisos aos clientes que autorizaram. Conecta pelo celular, sem servidor.">
                                <button type="button" className={styles.btn} onClick={() => setOpen('whatsapp')}>{waOn ? 'Gerenciar' : 'Conectar'}</button>
                            </ConnectorCard>
                        )}
                    </div>
                </section>
            )}

            {groups.map((g) => (
                <section key={g.categoria} className={styles.stack} aria-label={g.categoria}>
                    {cat !== g.categoria && <div className={styles.section_title} style={{ marginBottom: 0 }}>{g.categoria}</div>}
                    <div className={styles.card_grid}>
                        {g.apps.map((app) => {
                            const mine = byApp(app.app);
                            return (
                                <ConnectorCard key={app.app} logo={<AppLogo app={app.app} label={app.label} />} title={app.label} uso={app.uso}
                                    status={app.nativo ? <Pill tone="green">já ativo</Pill> : mine.length ? <Pill tone="green">conectado</Pill> : null}>
                                    {mine.map((c) => (
                                        <div key={c.id} className={styles.kv} style={{ alignItems: 'center' }}>
                                            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {tests[c.id]?.ok && <FiCheckCircle color="#16a34a" aria-label="testada" />} {c.name}
                                            </span>
                                            <span className={styles.btn_row}>
                                                {canWrite && <button type="button" className={`${styles.btn} ${styles.btn_sm}`} disabled={tests[c.id]?.busy} onClick={() => test(c)}>
                                                    {tests[c.id]?.busy ? 'Testando…' : 'Testar'}</button>}
                                                <button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_ghost}`} style={{ color: 'var(--c-danger)' }} onClick={() => remove(c)}>Remover</button>
                                            </span>
                                        </div>
                                    ))}
                                    {tests[mine[0]?.id]?.ok === false && <Banner tone="error">{tests[mine[0].id].mensagem}</Banner>}
                                    {canWrite && !app.nativo && (
                                        <button type="button" className={styles.btn} onClick={() => setConnecting(app)}>
                                            {mine.length ? 'Adicionar outra conta' : 'Conectar'}</button>
                                    )}
                                </ConnectorCard>
                            );
                        })}
                    </div>
                </section>
            ))}
            {data && groups.length === 0 && !showGoogle && !showWa && <Empty>Nenhum app encontrado{query ? ` para "${query}"` : ''}.</Empty>}
            {history.length > 0 && (
                <details>
                    <summary className={styles.muted} style={{ cursor: 'pointer' }}>Histórico de envios das automações</summary>
                    <div style={{ marginTop: 12 }}><SyncHistory history={history} /></div>
                </details>
            )}
            {connecting && <Conectar app={connecting} onClose={() => setConnecting(null)}
                onSaved={(conn) => { setConnecting(null); reload(); if (conn?.id) test(conn); }} />}
            {open === 'google' && <Painel title="Google" onClose={closePanel}><GoogleCalendarCard embedded /></Painel>}
            {open === 'whatsapp' && <Painel title="WhatsApp do escritório" onClose={closePanel}><WhatsAppCard embedded /></Painel>}
        </div>
    );
}
