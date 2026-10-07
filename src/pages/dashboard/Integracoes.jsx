import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiCheckCircle, FiExternalLink } from 'react-icons/fi';
import styles from '../../components/seguranca/seguranca.module.css';
import { Banner, Empty, PageHeader, Pill, errorMessage } from '../../components/seguranca/ui';
import useAuth from '../../hooks/useAuth';
import useLoader from '../gestao/useLoader';
import GoogleCalendarCard from '../../components/common/GoogleCalendarCard.jsx';
import WhatsAppCard from '../../components/common/WhatsAppCard.jsx';
import SyncHistory from '../../components/ui/SyncHistory.jsx';
import api from '../../services/api';
import { groupByCategory, integrationsApi, missingFields } from '../../services/integrations';

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

export default function Integracoes() {
    const { role } = useAuth();
    const canWrite = role !== 'VIEWER';
    const { data, error, reload } = useLoader(() => Promise.all([integrationsApi.catalog(), integrationsApi.connections(),
        api.get('sync-history/', { params: { page_size: 10 } }).then((r) => r.data).catch(() => [])]), []);
    const [query, setQuery] = useState('');
    const [cat, setCat] = useState('');
    const [connecting, setConnecting] = useState(null);
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
    const [catalog, connections, historyRaw] = data || [{ apps: [], categorias: [] }, [], []];
    const history = (historyRaw?.results ?? historyRaw ?? []).map((h) => ({ name: h.integration, description: h.description, time: h.time, status: h.status === 'sucesso' ? 'sucesso' : 'erro' }));
    const byApp = (app) => connections.filter((c) => c.app_name === app);
    const labelOf = (appKey) => catalog.apps.find((a) => a.app === appKey)?.label || appKey;
    const groups = groupByCategory(catalog, query).filter((g) => !cat || g.categoria === cat);
    const counts = Object.fromEntries((catalog.categorias || []).map((c) => [c, catalog.apps.filter((a) => a.categoria === c).length]));

    // CAD-227: antes eram 41 cartões com 29 botões azuis iguais. Agora: o que já está conectado em cima,
    // filtro por categoria e uma lista compacta com o botão "Conectar" discreto.
    return (
        <div className={styles.page}>
            <PageHeader title="Integrações" subtitle="Conecte as ferramentas que o escritório já usa. Cada app tem um guia de onde pegar os dados." />
            <WhatsAppCard />
            <GoogleCalendarCard />
            {connections.length > 0 && (
                <section className={styles.card} aria-labelledby="conectados-title">
                    <div id="conectados-title" className={styles.section_title}>Conectados <Pill tone="green">{connections.length}</Pill></div>
                    {connections.map((c) => (
                        <div key={c.id} className={styles.list_row}>
                            <div>
                                <strong>{labelOf(c.app_name)}</strong>
                                <div className={styles.muted} style={{ fontSize: '.85rem' }}>
                                    {tests[c.id]?.ok && <FiCheckCircle color="#16a34a" aria-label="testada" />} {c.name}
                                    {tests[c.id]?.ok === false && <span style={{ color: 'var(--c-danger)' }}> · {tests[c.id].mensagem}</span>}
                                </div>
                            </div>
                            <span className={styles.btn_row}>
                                {canWrite && <button type="button" className={`${styles.btn} ${styles.btn_sm}`} disabled={tests[c.id]?.busy} onClick={() => test(c)}>
                                    {tests[c.id]?.busy ? 'Testando…' : 'Testar'}</button>}
                                <button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_ghost}`} style={{ color: 'var(--c-danger)' }} onClick={() => remove(c)}>Remover</button>
                            </span>
                        </div>
                    ))}
                </section>
            )}
            <section className={styles.card} aria-labelledby="catalogo-title">
                <div className={styles.header_row} style={{ alignItems: 'flex-end', gap: 12 }}>
                    <div id="catalogo-title" className={styles.section_title} style={{ margin: 0 }}>Apps disponíveis</div>
                    <input className={styles.input} style={{ maxWidth: 320 }} value={query} onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar: assinatura, boleto, WhatsApp…" aria-label="Buscar app" />
                </div>
                <div className={styles.btn_row} role="group" aria-label="Categorias" style={{ margin: '12px 0 4px', gap: 6 }}>
                    <button type="button" className={`${styles.chip} ${!cat ? styles.chip_active : ''}`} aria-pressed={!cat} onClick={() => setCat('')}>Todos</button>
                    {(catalog.categorias || []).map((c) => (
                        <button key={c} type="button" className={`${styles.chip} ${cat === c ? styles.chip_active : ''}`} aria-pressed={cat === c}
                            onClick={() => setCat(cat === c ? '' : c)}>{c} <span className={styles.muted}>{counts[c]}</span></button>
                    ))}
                </div>
                {!data && <Empty>Carregando…</Empty>}
                {groups.map((g) => (
                    <div key={g.categoria} aria-label={g.categoria} role="group">
                        {!cat && <div className={styles.eyebrow_label}>{g.categoria}</div>}
                        {g.apps.map((app) => {
                            const mine = byApp(app.app);
                            return (
                                <div key={app.app} className={styles.list_row}>
                                    <div>
                                        <strong>{app.label}</strong>{' '}
                                        {app.nativo ? <Pill tone="green">já ativo</Pill> : mine.length ? <Pill tone="green">conectado</Pill> : null}
                                        <div className={`${styles.muted} ${styles.clamp2}`} style={{ fontSize: '.85rem' }}>{app.uso}</div>
                                    </div>
                                    {canWrite && !app.nativo && (
                                        <button type="button" className={`${styles.btn} ${styles.btn_sm}`} onClick={() => setConnecting(app)}>
                                            {mine.length ? 'Outra conta' : 'Conectar'}</button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
                {data && groups.length === 0 && <Empty>Nenhum app encontrado{query ? ` para "${query}"` : ''}.</Empty>}
            </section>
            <SyncHistory history={history} />
            {connecting && <Conectar app={connecting} onClose={() => setConnecting(null)}
                onSaved={(conn) => { setConnecting(null); reload(); if (conn?.id) test(conn); }} />}
        </div>
    );
}
