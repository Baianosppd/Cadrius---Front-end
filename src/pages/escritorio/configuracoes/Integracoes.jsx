import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiCheckCircle, FiExternalLink } from 'react-icons/fi';
import { SiGoogle } from 'react-icons/si';
import styles from '../../../components/ui/ui.module.css';
import s from '../../../components/integracoes/Integracoes.module.css';
import { Banner, Button, Chip, Empty, Field, FormModal, Input, Loading, Modal, PageHeader, Pill, Row, Stack } from '../../../components/ui';
import { errorMessage } from '../../../utils/format';
import useAuth from '../../../hooks/useAuth';
import useLoader from '../../../hooks/useLoader';
import GoogleCalendarCard from '../../../components/integracoes/GoogleCalendarCard.jsx';
import WhatsAppCard from '../../../components/integracoes/WhatsAppCard.jsx';
import SyncHistory from '../../../components/integracoes/SyncHistory.jsx';
import AppLogo from '../../../components/brand/AppLogo.jsx';
import api from '../../../services/api';
import { groupByCategory, integrationsApi, missingFields } from '../../../services/integrations';
import { gcal } from '../../../services/gcal';
import { whatsappApi } from '../../../services/whatsapp';

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
        <FormModal title={`Conectar ${app.label}`} size="xl" onClose={onClose} onSubmit={submit} busy={busy} error={error}
            submitLabel="Salvar e testar" autoComplete="off">
            <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>{app.uso}</p>
            <div className={`${styles.two_col} ${styles.align_start}`}>
                <Stack>
                    <Field label="Nome da conexão"><Input value={name} maxLength={100} onChange={(e) => setName(e.target.value)} required /></Field>
                    {app.campos.map((f) => (
                        <Field key={f.key} label={`${f.label}${f.required ? ' *' : ''}`}>
                            <Input type={f.secret ? 'password' : 'text'} autoComplete="off" placeholder={f.placeholder}
                                value={values[f.key] || ''} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
                        </Field>
                    ))}
                    <Banner tone="info">Credenciais ficam cifradas e não aparecem de novo depois de salvas.</Banner>
                </Stack>
                <Stack gap={3} className={`${styles.card} ${styles.bg_soft}`}>
                    <div className={`${styles.section_title} ${styles.mb_0}`}>Onde pegar cada dado</div>
                    <ol className={s.guide}>{app.guia.map((g, i) => <li key={i}>{g}</li>)}</ol>
                    {app.links.length > 0 && (
                        <Row>
                            {app.links.map((l) => (
                                <Button key={l.url} as="a" size="sm" variant="ghost" href={l.url} target="_blank" rel="noreferrer noopener">
                                    {l.label} <FiExternalLink aria-hidden="true" /></Button>
                            ))}
                        </Row>
                    )}
                    {app.validar && <p className={`${styles.muted} ${styles.text_xs} ${styles.mb_0}`}>Atenção: {app.validar}</p>}
                </Stack>
            </div>
        </FormModal>
    );
}

// Janela de um conector "da casa" (Google, WhatsApp do escritório): o conteúdo completo fica aqui, não na página.
function Painel({ title, onClose, children }) {
    return (
        <Modal title={title} size="xl" onClose={onClose} footer={<Button onClick={onClose}>Fechar</Button>}>
            {children}
        </Modal>
    );
}

// Cartão de conector: logo, nome, estado e uma linha do que faz. Mesmo formato para todos.
function ConnectorCard({ logo, title, status, uso, children }) {
    return (
        <Stack gap={3} className={styles.card}>
            <Row gap={3} wrap={false}>
                {logo}
                <div className={styles.flex_1}>
                    <strong>{title}</strong>
                    <div>{status}</div>
                </div>
            </Row>
            <p className={`${styles.muted} ${styles.clamp2} ${styles.flex_1} ${styles.mt_0} ${styles.mb_0}`}>{uso}</p>
            {children}
        </Stack>
    );
}

const GoogleLogo = () => <span aria-hidden="true" className={s.logo_box}><SiGoogle size={20} color="#4285F4" /></span>;

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
            <Row justify="between" gap={3}>
                <Row role="group" aria-label="Categorias">
                    <Chip active={!cat} onClick={() => setCat('')}>Todos</Chip>
                    {nConnected > 0 && (
                        <Chip active={cat === '__on'} onClick={() => setCat(cat === '__on' ? '' : '__on')}>Conectados <span className={styles.muted}>{nConnected}</span></Chip>
                    )}
                    {(catalog.categorias || []).map((c) => (
                        <Chip key={c} active={cat === c} onClick={() => setCat(cat === c ? '' : c)}>{c} <span className={styles.muted}>{counts[c]}</span></Chip>
                    ))}
                </Row>
                <Input className={s.search} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar app" aria-label="Buscar app" />
            </Row>
            {!data && <Loading />}

            {(showGoogle || showWa) && (
                <Stack as="section" aria-label="Principais">
                    {!cat && <div className={`${styles.section_title} ${styles.mb_0}`}>Principais</div>}
                    <div className={styles.card_grid}>
                        {showGoogle && (
                            <ConnectorCard logo={<GoogleLogo />} title="Google"
                                status={googleOn ? <Pill tone="green">conectado</Pill> : gst.status === 'needs_reauth' ? <Pill tone="yellow">reconectar</Pill> : null}
                                uso="Agenda, Planilhas e Documentos numa conexão só, na sua própria conta.">
                                <Button className={styles.w_fit} onClick={() => setOpen('google')}>{googleOn ? 'Gerenciar' : 'Conectar'}</Button>
                            </ConnectorCard>
                        )}
                        {showWa && (
                            <ConnectorCard logo={<AppLogo app="WHATSAPP" label="WhatsApp" />} title="WhatsApp do escritório"
                                status={waOn ? <Pill tone="green">conectado</Pill> : null}
                                uso="O número do escritório envia os avisos aos clientes que autorizaram. Conecta pelo celular, sem servidor.">
                                <Button className={styles.w_fit} onClick={() => setOpen('whatsapp')}>{waOn ? 'Gerenciar' : 'Conectar'}</Button>
                            </ConnectorCard>
                        )}
                    </div>
                </Stack>
            )}

            {groups.map((g) => (
                <Stack as="section" key={g.categoria} aria-label={g.categoria}>
                    {cat !== g.categoria && <div className={`${styles.section_title} ${styles.mb_0}`}>{g.categoria}</div>}
                    <div className={styles.card_grid}>
                        {g.apps.map((app) => {
                            const mine = byApp(app.app);
                            return (
                                <ConnectorCard key={app.app} logo={<AppLogo app={app.app} label={app.label} />} title={app.label} uso={app.uso}
                                    status={app.nativo ? <Pill tone="green">já ativo</Pill> : mine.length ? <Pill tone="green">conectado</Pill> : null}>
                                    {mine.map((c) => (
                                        <div key={c.id} className={`${styles.kv} ${styles.align_center}`}>
                                            <span className={styles.truncate}>
                                                {tests[c.id]?.ok && <FiCheckCircle color="var(--c-success)" aria-label="testada" />} {c.name}
                                            </span>
                                            <Row gap={1} wrap={false}>
                                                {canWrite && <Button size="sm" loading={tests[c.id]?.busy} loadingLabel="Testando…" onClick={() => test(c)}>Testar</Button>}
                                                <Button size="sm" variant="danger" onClick={() => remove(c)}>Remover</Button>
                                            </Row>
                                        </div>
                                    ))}
                                    {tests[mine[0]?.id]?.ok === false && <Banner tone="error">{tests[mine[0].id].mensagem}</Banner>}
                                    {canWrite && !app.nativo && (
                                        <Button className={styles.w_fit} onClick={() => setConnecting(app)}>{mine.length ? 'Adicionar outra conta' : 'Conectar'}</Button>
                                    )}
                                </ConnectorCard>
                            );
                        })}
                    </div>
                </Stack>
            ))}
            {data && groups.length === 0 && !showGoogle && !showWa && <Empty>Nenhum app encontrado{query ? ` para "${query}"` : ''}.</Empty>}
            {history.length > 0 && (
                <details>
                    <summary className={`${styles.muted} ${styles.clickable}`}>Histórico de envios das automações</summary>
                    <div className={styles.mt_3}><SyncHistory history={history} /></div>
                </details>
            )}
            {connecting && <Conectar app={connecting} onClose={() => setConnecting(null)}
                onSaved={(conn) => { setConnecting(null); reload(); if (conn?.id) test(conn); }} />}
            {open === 'google' && <Painel title="Google" onClose={closePanel}><GoogleCalendarCard embedded /></Painel>}
            {open === 'whatsapp' && <Painel title="WhatsApp do escritório" onClose={closePanel}><WhatsAppCard embedded /></Painel>}
        </div>
    );
}
