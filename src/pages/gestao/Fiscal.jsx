import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../../components/ui/ui.module.css';
import { FiDownload } from 'react-icons/fi';
import { Banner, Button, Empty, Field, FilterBar, FormModal, Input, Loading, PageHeader, Row, Select, StatCard, StatusPill, Table, Tabs } from '../../components/ui';
import { errorMessage, fmtDate, fmtDateTime } from '../../utils/format';
import { NF_MANUAL, NF_STATUS, backofficeApi, monthRange } from '../../services/backoffice';
import { NfseModal, Obrigacoes } from '../../components/gestao/FiscalF';
import { brl } from '../../services/financeiro';
import useLoader from '../../hooks/useLoader';

function RegistrarNF({ payment, onDone, onCancel }) {
    const [form, setForm] = useState({ status: 'issued', number: '', issued_at: new Date().toISOString().slice(0, 10), note: '', reason: '' });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            await backofficeApi.fiscalInvoice(payment.id, { ...form, reason: form.reason.trim() || 'Registro de NF' });
            toast.success('Nota registrada.');
            onDone();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };
    return (
        <FormModal title={`Nota fiscal — ${payment.tomador.nome}`} onClose={onCancel} onSubmit={save} busy={busy} error={error}>
            <div className={`${styles.muted} ${styles.mt_0}`}>{payment.descricao} · {brl(payment.valor_brl)} · pago em {fmtDateTime(payment.pago_em)}</div>
            <Field label="Situação">
                <Select value={form.status} onChange={set('status')}>
                    {NF_MANUAL.map((k) => <option key={k} value={k}>{NF_STATUS[k].label}</option>)}
                </Select>
            </Field>
            {form.status === 'issued' && (
                <FilterBar>
                    <Field label="Número da NF"><Input value={form.number} onChange={set('number')} /></Field>
                    <Field label="Emitida em"><Input type="date" value={form.issued_at} onChange={set('issued_at')} /></Field>
                </FilterBar>
            )}
            <Field label="Observação"><Input value={form.note} onChange={set('note')} maxLength={255} /></Field>
        </FormModal>
    );
}

function Recebimentos() {
    const [period, setPeriod] = useState(monthRange());
    const [status, setStatus] = useState('');
    const [editing, setEditing] = useState(null);
    const [nfse, setNfse] = useState(null);
    const params = { ...period, ...(status ? { status } : {}) };
    const { data, error, reload } = useLoader(() => backofficeApi.fiscalPayments(params), [period.start, period.end, status]);
    const [exporting, setExporting] = useState(false);

    const exportCsv = async () => {
        setExporting(true);
        try {
            const blob = await backofficeApi.fiscalExport(params);
            const url = URL.createObjectURL(blob);
            Object.assign(document.createElement('a'), { href: url, download: `cadrius-recebimentos-${period.start}-a-${period.end}.csv` }).click();
            URL.revokeObjectURL(url);
        } catch (err) {
            toast.error(errorMessage(err));
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className={styles.stack}>
            <FilterBar>
                <Field label="De"><Input type="date" value={period.start} onChange={(e) => setPeriod((p) => ({ ...p, start: e.target.value }))} /></Field>
                <Field label="Até"><Input type="date" value={period.end} onChange={(e) => setPeriod((p) => ({ ...p, end: e.target.value }))} /></Field>
                <Field label="Situação da NF">
                    <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="">Todas</option>
                        {Object.entries(NF_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </Select>
                </Field>
                <Button icon={FiDownload} loading={exporting} onClick={exportCsv}>Exportar CSV para o contador</Button>
            </FilterBar>
            {error && <Banner tone="error">{error}</Banner>}
            {!data && !error && <Loading />}
            {data && (
                <>
                    <div className={styles.grid}>
                        <StatCard title="Recebido no período" value={brl(data.resumo.total_brl)} note={`${data.resumo.quantidade} recebimentos`} />
                        <StatCard title="NF pendentes" value={data.resumo.nf_pendentes} tone={data.resumo.nf_pendentes ? 'yellow' : 'green'} />
                        {data.resumo.faturamento_12m && <StatCard title="Faturamento 12 meses (RBT12)" value={brl(data.resumo.faturamento_12m.rbt12_brl)}
                            note={`${data.resumo.faturamento_12m.uso_do_limite_pct}% do limite do Simples`} tone={data.resumo.faturamento_12m.alerta ? 'yellow' : undefined} />}
                        {Object.entries(data.resumo.por_tipo).map(([k, v]) => (
                            <StatCard key={k} title={k === 'subscription' ? 'Assinaturas' : 'Pacotes de créditos'} value={brl(v.total_brl)} note={`${v.quantidade} recebimentos`} />
                        ))}
                    </div>
                    {data.resumo.faturamento_12m?.alerta && <Banner tone="warn">{data.resumo.faturamento_12m.alerta}</Banner>}
                    <Table columns={['Pago em', 'Tomador', 'Descrição', 'Valor', 'NF', { label: '', className: styles.td_actions }]}
                        empty={data.resultados.length === 0 && <Empty>Nenhum recebimento no período.</Empty>}>
                        {data.resultados.map((p) => (
                            <tr key={p.id}>
                                <td>{fmtDateTime(p.pago_em)}</td>
                                <td data-label="Tomador"><strong>{p.tomador.nome}</strong><div className={styles.muted}>{p.tomador.documento || 'sem CPF/CNPJ cadastrado'}</div></td>
                                <td data-label="Descrição">{p.descricao}<div className={styles.muted}>{p.tipo_label}</div></td>
                                <td data-label="Valor">{brl(p.valor_brl)}</td>
                                <td data-label="NF"><StatusPill map={NF_STATUS} value={p.nf_status} />{p.nf_numero && <div className={styles.muted}>nº {p.nf_numero} · {fmtDate(p.nf_emitida_em)}</div>}</td>
                                <td className={styles.td_actions}>
                                    <Row gap={1} wrap={false}>
                                        <Button size="sm" variant="primary" onClick={() => setNfse(p)}>Conferir NFS-e</Button>
                                        <Button size="sm" onClick={() => setEditing(p)}>Registrar NF</Button>
                                    </Row>
                                </td>
                            </tr>
                        ))}
                    </Table>
                </>
            )}
            {editing && <RegistrarNF payment={editing} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); reload(); }} />}
            {nfse && <NfseModal payment={nfse} onClose={() => setNfse(null)} onChanged={reload} />}
        </div>
    );
}

const TABS = [{ id: 'recebimentos', label: 'Recebimentos e notas' }, { id: 'obrigacoes', label: 'Obrigações' }];

// Setor Fiscal da Cadrius: fase 1 (registro), fase 2 (NFS-e pelo emissor) e fase 3 (obrigações) — CAD-170/175
export default function Fiscal() {
    const [tab, setTab] = useState(() => (new URLSearchParams(window.location.search).get('aba') === 'obrigacoes' ? 'obrigacoes' : 'recebimentos'));
    return (
        <div className={styles.page}>
            <PageHeader title="Fiscal" subtitle="Recebimentos, NFS-e e obrigações" />
            <Tabs tabs={TABS} value={tab} onChange={setTab} />
            {tab === 'recebimentos' ? <Recebimentos /> : <Obrigacoes />}
        </div>
    );
}
