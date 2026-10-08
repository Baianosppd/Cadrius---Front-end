import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import TabBar from '../../components/ui/TabBar';
import styles from '../../components/seguranca/seguranca.module.css';
import Markdown from '../../components/seguranca/Markdown';
import { Banner, Empty, errorMessage, fmtDate, fmtDateTime, Loading, PageHeader, Pill } from '../../components/seguranca/ui';

const KIND = { terms: 'Termos de Uso', privacy: 'Política de Privacidade', ciencia: 'Termo de Ciência', cookies: 'Cookies' };
const REQUEST_TYPES = [
    ['access', 'Confirmação/acesso aos meus dados'], ['correction', 'Correção de dados'],
    ['portability', 'Portabilidade'], ['info_sharing', 'Com quem meus dados são compartilhados'],
    ['revoke_consent', 'Revogar consentimento'], ['anonymization', 'Anonimização, bloqueio ou eliminação'],
    ['deletion', 'Eliminar minha conta'],
];
const DSR_STATUS = {
    open: ['Aberto', 'blue'], in_progress: ['Em atendimento', 'yellow'], fulfilled: ['Atendido', 'green'],
    rejected: ['Recusado', 'red'], cancelled: ['Cancelado', 'gray'],
};

function Aceites() {
    const [data, setData] = useState(null);
    const [docs, setDocs] = useState([]);
    const [open, setOpen] = useState(null);

    useEffect(() => {
        api.get('legal/consents/me/').then((r) => setData(r.data)).catch(() => setData({ consents: [], pending: [] }));
        api.get('legal/documents/').then((r) => setDocs(r.data)).catch(() => setDocs([]));
    }, []);

    if (!data) return <Loading />;
    return (
        <div className={styles.page}>
            {data.pending.length > 0 && <Banner tone="warn">Há {data.pending.length} documento(s) novo(s) aguardando seu aceite.</Banner>}
            <div className={styles.section_title}>Documentos vigentes</div>
            <div className={styles.table_wrap}>
                <table className={styles.table}>
                    <thead><tr><th>Documento</th><th>Versão</th><th>Publicado em</th><th /></tr></thead>
                    <tbody>
                        {docs.map((d) => (
                            <tr key={d.id}>
                                <td>{d.title || KIND[d.kind]}</td><td>{d.version}</td><td>{fmtDate(d.published_at)}</td>
                                <td><button className={styles.btn} onClick={() => setOpen(open === d.id ? null : d.id)}>{open === d.id ? 'Fechar' : 'Ler'}</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {open && <div className={styles.doc_text} tabIndex={0}><Markdown text={docs.find((d) => d.id === open)?.content_md} /></div>}

            <div className={styles.section_title}>Meu histórico de aceites</div>
            {data.consents.length === 0 ? <Empty>Nenhum aceite registrado.</Empty> : (
                <div className={styles.table_wrap}>
                    <table className={styles.table}>
                        <thead><tr><th>Documento</th><th>Versão</th><th>Quando</th><th>Situação</th><th>Prova (SHA-256)</th></tr></thead>
                        <tbody>
                            {data.consents.map((c) => (
                                <tr key={c.id}>
                                    <td>{KIND[c.kind] || c.kind}</td><td>{c.version}</td><td>{fmtDateTime(c.occurred_at)}</td>
                                    <td><Pill tone={c.granted ? 'green' : 'gray'}>{c.granted ? 'Aceito' : 'Revogado'}</Pill></td>
                                    <td className={styles.mono} title={c.evidence_sha256}>{(c.evidence_sha256 || '').slice(0, 12)}…</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function MeusDados() {
    const [requests, setRequests] = useState([]);
    const [type, setType] = useState('access');
    const [notes, setNotes] = useState('');
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => api.get('privacy/requests/').then((r) => setRequests(r.data)).catch(() => setRequests([])), []);
    useEffect(() => { load(); }, [load]);

    const exportData = async () => {
        try {
            const { data } = await api.get('privacy/me/export/');
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'meus-dados-cadrius.json'; a.click();
            URL.revokeObjectURL(url);
        } catch (err) { toast.error(errorMessage(err)); }
    };

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await api.post('privacy/requests/', { type, notes });
            toast.success('Pedido registrado. Responderemos em até 15 dias.');
            setNotes('');
            load();
        } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };

    return (
        <div className={styles.page}>
            <div className={styles.two_col}>
                <div className={styles.card}>
                    <div className={styles.section_title}>Baixar meus dados</div>
                    <p className={styles.muted} style={{ marginBottom: 12 }}>Cópia em formato estruturado (JSON) dos dados que mantemos sobre você (LGPD art. 18, II e V).</p>
                    <button className={`${styles.btn} ${styles.btn_primary}`} onClick={exportData}>Baixar arquivo</button>
                </div>
                <form className={styles.card} onSubmit={submit}>
                    <div className={styles.section_title}>Fazer um pedido (direitos do titular)</div>
                    <div className={styles.field}>
                        Tipo de pedido
                        <select className={styles.select} value={type} onChange={(e) => setType(e.target.value)}>
                            {REQUEST_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </div>
                    <div className={styles.field} style={{ marginTop: 10 }}>
                        Detalhes (opcional)
                        <textarea className={styles.textarea} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                    <div style={{ marginTop: 12 }}><button className={`${styles.btn} ${styles.btn_primary}`} disabled={busy}>Enviar pedido</button></div>
                </form>
            </div>
            <div className={styles.section_title}>Meus pedidos</div>
            {requests.length === 0 ? <Empty>Você ainda não fez pedidos.</Empty> : (
                <div className={styles.table_wrap}>
                    <table className={styles.table}>
                        <thead><tr><th>Tipo</th><th>Situação</th><th>Aberto em</th><th>Prazo</th><th>Resposta</th></tr></thead>
                        <tbody>
                            {requests.map((r) => {
                                const [label, tone] = DSR_STATUS[r.status] || [r.status, 'gray'];
                                return (
                                    <tr key={r.id}>
                                        <td>{REQUEST_TYPES.find(([v]) => v === r.type)?.[1] || r.type}</td>
                                        <td><Pill tone={r.overdue ? 'red' : tone}>{r.overdue ? 'Atrasado' : label}</Pill></td>
                                        <td>{fmtDate(r.opened_at)}</td><td>{fmtDate(r.due_at)}</td><td>{r.resolution || '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function Suboperadores() {
    const [list, setList] = useState(null);
    useEffect(() => { api.get('legal/subprocessors/').then((r) => setList(r.data)).catch(() => setList([])); }, []);
    if (!list) return <Loading />;
    return (
        <div className={styles.page}>
            <p className={styles.muted}>Empresas que tratam dados em nosso nome (LGPD art. 9º — transparência).</p>
            <div className={styles.table_wrap}>
                <table className={styles.table}>
                    <thead><tr><th>Empresa</th><th>País</th><th>Finalidade</th><th>Dados</th><th>Transferência internacional</th></tr></thead>
                    <tbody>
                        {list.map((s) => (
                            <tr key={s.name}>
                                <td>{s.name}</td><td>{s.country}</td><td>{s.purpose}</td>
                                <td>{(s.data_categories || []).join(', ')}</td>
                                <td>{s.international_transfer ? <Pill tone="yellow">Sim</Pill> : <Pill tone="green">Não</Pill>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function Encerramento({ organization }) {
    const [confirm, setConfirm] = useState('');
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState(null);

    const close = async () => {
        if (!window.confirm('Esta ação agenda a eliminação dos dados do escritório em 30 dias. Continuar?')) return;
        setBusy(true);
        try {
            const { data } = await api.post('privacy/organization/close/', { confirm });
            setResult(data);
        } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };

    return (
        <div className={styles.page}>
            <Banner tone="warn">
                Encerrar o escritório agenda a eliminação dos dados em 30 dias. Durante esse prazo os dados ficam bloqueados e podem ser exportados.
                Registros de auditoria são mantidos pelo prazo legal.
            </Banner>
            {result ? <Banner tone="ok">Encerramento agendado. Eliminação prevista para {fmtDate(result.purge_after)}.</Banner> : (
                <div className={styles.card} style={{ maxWidth: 520 }}>
                    <div className={styles.field}>
                        Digite o nome exato do escritório (<strong>{organization?.name}</strong>) para confirmar
                        <input className={styles.input} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                    </div>
                    <div style={{ marginTop: 12 }}>
                        <button className={`${styles.btn} ${styles.btn_danger}`} disabled={busy || confirm !== organization?.name} onClick={close}>Encerrar escritório</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Privacidade() {
    const { organization, role } = useAuth();
    const [tab, setTab] = useState('aceites');
    const tabs = [
        { id: 'aceites', label: 'Termos e aceites' }, { id: 'dados', label: 'Meus dados' },
        { id: 'sub', label: 'Quem trata seus dados' },
        ...(role === 'OWNER' ? [{ id: 'encerrar', label: 'Encerrar escritório' }] : []),
    ];
    return (
        <div className={styles.page}>
            <PageHeader title="Privacidade e dados" subtitle="Seus direitos e seus dados (LGPD)" />
            <TabBar tabs={tabs} activeTab={tab} onTabChange={setTab} />
            {tab === 'aceites' && <Aceites />}
            {tab === 'dados' && <MeusDados />}
            {tab === 'sub' && <Suboperadores />}
            {tab === 'encerrar' && <Encerramento organization={organization} />}
        </div>
    );
}
