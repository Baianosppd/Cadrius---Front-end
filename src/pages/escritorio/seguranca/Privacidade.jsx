import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import useAuth from '../../../hooks/useAuth';
import styles from '../../../components/ui/ui.module.css';
import Markdown from '../../../components/seguranca/Markdown';
import { Banner, Button, Empty, Field, Input, Loading, PageHeader, Pill, Select, Stack, Table, Tabs, Textarea } from '../../../components/ui';
import { errorMessage, fmtDate, fmtDateTime } from '../../../utils/format';

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
        <Stack>
            {data.pending.length > 0 && <Banner tone="warn">Há {data.pending.length} documento(s) novo(s) aguardando seu aceite.</Banner>}
            <div className={`${styles.section_title} ${styles.mb_0}`}>Documentos vigentes</div>
            <Table columns={['Documento', 'Versão', 'Publicado em', { label: '', className: styles.td_actions }]}>
                {docs.map((d) => (
                    <tr key={d.id}>
                        <td>{d.title || KIND[d.kind]}</td><td data-label="Versão">{d.version}</td><td data-label="Publicado em">{fmtDate(d.published_at)}</td>
                        <td className={styles.td_actions}>
                            <Button size="sm" aria-expanded={open === d.id} onClick={() => setOpen(open === d.id ? null : d.id)}>{open === d.id ? 'Fechar' : 'Ler'}</Button>
                        </td>
                    </tr>
                ))}
            </Table>
            {open && <div className={styles.doc_text} tabIndex={0}><Markdown text={docs.find((d) => d.id === open)?.content_md} /></div>}

            <div className={`${styles.section_title} ${styles.mb_0}`}>Meu histórico de aceites</div>
            {data.consents.length === 0 ? <Empty>Nenhum aceite registrado.</Empty> : (
                <Table columns={['Documento', 'Versão', 'Quando', 'Situação', 'Prova (SHA-256)']}>
                    {data.consents.map((c) => (
                        <tr key={c.id}>
                            <td>{KIND[c.kind] || c.kind}</td><td data-label="Versão">{c.version}</td><td data-label="Quando">{fmtDateTime(c.occurred_at)}</td>
                            <td data-label="Situação"><Pill tone={c.granted ? 'green' : 'gray'}>{c.granted ? 'Aceito' : 'Revogado'}</Pill></td>
                            <td data-label="Prova" className={styles.mono} title={c.evidence_sha256}>{(c.evidence_sha256 || '').slice(0, 12)}…</td>
                        </tr>
                    ))}
                </Table>
            )}
        </Stack>
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
        <Stack>
            <div className={`${styles.two_col} ${styles.align_start}`}>
                <Stack gap={3} className={styles.card}>
                    <div className={`${styles.section_title} ${styles.mb_0}`}>Baixar meus dados</div>
                    <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>Cópia em formato estruturado (JSON) dos dados que mantemos sobre você (LGPD art. 18, II e V).</p>
                    <Button variant="primary" className={styles.w_fit} onClick={exportData}>Baixar arquivo</Button>
                </Stack>
                <Stack as="form" gap={3} className={styles.card} onSubmit={submit}>
                    <div className={`${styles.section_title} ${styles.mb_0}`}>Fazer um pedido (direitos do titular)</div>
                    <Field label="Tipo de pedido">
                        <Select value={type} onChange={(e) => setType(e.target.value)}>
                            {REQUEST_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </Select>
                    </Field>
                    <Field label="Detalhes (opcional)">
                        <Textarea maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </Field>
                    <Button type="submit" variant="primary" className={styles.w_fit} loading={busy} loadingLabel="Enviando…">Enviar pedido</Button>
                </Stack>
            </div>
            <div className={`${styles.section_title} ${styles.mb_0}`}>Meus pedidos</div>
            {requests.length === 0 ? <Empty>Você ainda não fez pedidos.</Empty> : (
                <Table columns={['Tipo', 'Situação', 'Aberto em', 'Prazo', 'Resposta']}>
                    {requests.map((r) => {
                        const [label, tone] = DSR_STATUS[r.status] || [r.status, 'gray'];
                        return (
                            <tr key={r.id}>
                                <td>{REQUEST_TYPES.find(([v]) => v === r.type)?.[1] || r.type}</td>
                                <td data-label="Situação"><Pill tone={r.overdue ? 'red' : tone}>{r.overdue ? 'Atrasado' : label}</Pill></td>
                                <td data-label="Aberto em">{fmtDate(r.opened_at)}</td><td data-label="Prazo">{fmtDate(r.due_at)}</td>
                                <td data-label="Resposta">{r.resolution || '—'}</td>
                            </tr>
                        );
                    })}
                </Table>
            )}
        </Stack>
    );
}

function Suboperadores() {
    const [list, setList] = useState(null);
    useEffect(() => { api.get('legal/subprocessors/').then((r) => setList(r.data)).catch(() => setList([])); }, []);
    if (!list) return <Loading />;
    return (
        <Stack>
            <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>Empresas que tratam dados em nosso nome (LGPD art. 9º — transparência).</p>
            <Table columns={['Empresa', 'País', 'Finalidade', 'Dados', 'Transferência internacional']}>
                {list.map((s) => (
                    <tr key={s.name}>
                        <td><strong>{s.name}</strong></td><td data-label="País">{s.country}</td><td data-label="Finalidade">{s.purpose}</td>
                        <td data-label="Dados">{(s.data_categories || []).join(', ')}</td>
                        <td data-label="Internacional">{s.international_transfer ? <Pill tone="yellow">Sim</Pill> : <Pill tone="green">Não</Pill>}</td>
                    </tr>
                ))}
            </Table>
        </Stack>
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
        <Stack>
            <Banner tone="warn">
                Encerrar o escritório agenda a eliminação dos dados em 30 dias. Durante esse prazo os dados ficam bloqueados e podem ser exportados.
                Registros de auditoria são mantidos pelo prazo legal.
            </Banner>
            {result ? <Banner tone="ok">Encerramento agendado. Eliminação prevista para {fmtDate(result.purge_after)}.</Banner> : (
                <Stack gap={3} className={`${styles.card} ${styles.narrow}`}>
                    <Field label={<>Digite o nome exato do escritório (<strong>{organization?.name}</strong>) para confirmar</>}>
                        <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                    </Field>
                    <Button variant="danger" className={styles.w_fit} disabled={confirm !== organization?.name} loading={busy} onClick={close}>Encerrar escritório</Button>
                </Stack>
            )}
        </Stack>
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
            <Tabs tabs={tabs} value={tab} onChange={setTab} />
            {tab === 'aceites' && <Aceites />}
            {tab === 'dados' && <MeusDados />}
            {tab === 'sub' && <Suboperadores />}
            {tab === 'encerrar' && <Encerramento organization={organization} />}
        </div>
    );
}
