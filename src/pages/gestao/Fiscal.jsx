import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../../components/seguranca/seguranca.module.css';
import { Banner, Empty, errorMessage, fmtDate, fmtDateTime, Loading, PageHeader, StatCard, StatusPill } from '../../components/seguranca/ui';
import { NF_MANUAL, NF_STATUS, backofficeApi, monthRange } from '../../services/backoffice';
import { NfseModal, Obrigacoes } from '../../components/gestao/FiscalF';
import { brl } from '../../services/financeiro';
import useLoader from './useLoader';

function RegistrarNF({ payment, onDone, onCancel }) {
    const [form, setForm] = useState({ status: 'issued', number: '', issued_at: new Date().toISOString().slice(0, 10), note: '', reason: '' });
    const [busy, setBusy] = useState(false);
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    const save = async () => {
        setBusy(true);
        try {
            await backofficeApi.fiscalInvoice(payment.id, { ...form, reason: form.reason.trim() || 'Registro de NF' });
            toast.success('Nota registrada.');
            onDone();
        } catch (err) {
            toast.error(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };
    return (
        <div className={styles.overlay} role="dialog" aria-modal="true">
            <div className={styles.modal}>
                <div className={styles.modal_title}>Nota fiscal — {payment.tomador.nome}</div>
                <div className={styles.muted}>{payment.descricao} · {brl(payment.valor_brl)} · pago em {fmtDateTime(payment.pago_em)}</div>
                <label className={styles.field}>Situação
                    <select className={styles.select} value={form.status} onChange={set('status')}>
                        {NF_MANUAL.map((k) => <option key={k} value={k}>{NF_STATUS[k].label}</option>)}
                    </select>
                </label>
                {form.status === 'issued' && (
                    <div className={styles.filters}>
                        <label className={styles.field}>Número da NF<input className={styles.input} value={form.number} onChange={set('number')} /></label>
                        <label className={styles.field}>Emitida em<input className={styles.input} type="date" value={form.issued_at} onChange={set('issued_at')} /></label>
                    </div>
                )}
                <label className={styles.field}>Observação<input className={styles.input} value={form.note} onChange={set('note')} maxLength={255} /></label>
                <div className={styles.btn_row}>
                    <button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={save} disabled={busy}>Salvar</button>
                    <button type="button" className={styles.btn} onClick={onCancel} disabled={busy}>Cancelar</button>
                </div>
            </div>
        </div>
    );
}

function Recebimentos() {
    const [period, setPeriod] = useState(monthRange());
    const [status, setStatus] = useState('');
    const [editing, setEditing] = useState(null);
    const [nfse, setNfse] = useState(null);
    const params = { ...period, ...(status ? { status } : {}) };
    const { data, error, reload } = useLoader(() => backofficeApi.fiscalPayments(params), [period.start, period.end, status]);

    const exportCsv = async () => {
        try {
            const blob = await backofficeApi.fiscalExport(params);
            const url = URL.createObjectURL(blob);
            Object.assign(document.createElement('a'), { href: url, download: `cadrius-recebimentos-${period.start}-a-${period.end}.csv` }).click();
            URL.revokeObjectURL(url);
        } catch (err) {
            toast.error(errorMessage(err));
        }
    };

    return (
        <div className={styles.stack}>
            <div className={styles.btn_row}><button type="button" className={styles.btn} onClick={exportCsv}>Exportar CSV para o contador</button></div>
            <div className={styles.filters}>
                <label className={styles.field}>De<input className={styles.input} type="date" value={period.start} onChange={(e) => setPeriod((p) => ({ ...p, start: e.target.value }))} /></label>
                <label className={styles.field}>Até<input className={styles.input} type="date" value={period.end} onChange={(e) => setPeriod((p) => ({ ...p, end: e.target.value }))} /></label>
                <label className={styles.field}>Situação da NF
                    <select className={styles.select} value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="">Todas</option>
                        {Object.entries(NF_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                </label>
            </div>
            {error && <Banner tone="error">{error}</Banner>}
            {!data && !error && <Loading />}
            {data && (
                <>
                    <div className={styles.grid}>
                        <StatCard title="Recebido no período" value={brl(data.resumo.total_brl)} note={`${data.resumo.quantidade} recebimentos`} />
                        <StatCard title="NF pendentes" value={data.resumo.nf_pendentes} tone={data.resumo.nf_pendentes ? 'yellow' : 'green'} />
                        {data.resumo.faturamento_12m && <StatCard title="Faturamento 12 meses (RBT12)" value={brl(data.resumo.faturamento_12m.rbt12_brl)}
                            note={`${data.resumo.faturamento_12m.uso_do_limite_pct}% do limite do Simples`} tone={data.resumo.faturamento_12m.alerta ? 'yellow' : undefined} />}
                        {data.resumo.faturamento_12m?.alerta && <Banner tone="warn">{data.resumo.faturamento_12m.alerta}</Banner>}
                        {Object.entries(data.resumo.por_tipo).map(([k, v]) => (
                            <StatCard key={k} title={k === 'subscription' ? 'Assinaturas' : 'Pacotes de créditos'} value={brl(v.total_brl)} note={`${v.quantidade} recebimentos`} />
                        ))}
                    </div>
                    <div className={styles.table_wrap}>
                        <table className={styles.table}>
                            <thead><tr><th>Pago em</th><th>Tomador</th><th>Descrição</th><th>Valor</th><th>NF</th><th /></tr></thead>
                            <tbody>
                                {data.resultados.length === 0 && <tr><td colSpan={6}><Empty>Nenhum recebimento no período.</Empty></td></tr>}
                                {data.resultados.map((p) => (
                                    <tr key={p.id}>
                                        <td>{fmtDateTime(p.pago_em)}</td>
                                        <td><strong>{p.tomador.nome}</strong><div className={styles.muted}>{p.tomador.documento || 'sem CPF/CNPJ cadastrado'}</div></td>
                                        <td>{p.descricao}<div className={styles.muted}>{p.tipo_label}</div></td>
                                        <td>{brl(p.valor_brl)}</td>
                                        <td><StatusPill map={NF_STATUS} value={p.nf_status} />{p.nf_numero && <div className={styles.muted}>nº {p.nf_numero} · {fmtDate(p.nf_emitida_em)}</div>}</td>
                                        <td><div className={styles.btn_row}>
                                            <button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_primary}`} onClick={() => setNfse(p)}>Conferir NFS-e</button>
                                            <button type="button" className={`${styles.btn} ${styles.btn_sm}`} onClick={() => setEditing(p)}>Registrar NF</button>
                                        </div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
            {editing && <RegistrarNF payment={editing} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); reload(); }} />}
            {nfse && <NfseModal payment={nfse} onClose={() => setNfse(null)} onChanged={reload} />}
        </div>
    );
}

const TABS = [['recebimentos', 'Recebimentos e notas'], ['obrigacoes', 'Obrigações']];

// Setor Fiscal da Cadrius: fase 1 (registro), fase 2 (NFS-e pelo emissor) e fase 3 (obrigações) — CAD-170/175
export default function Fiscal() {
    const [tab, setTab] = useState(() => (new URLSearchParams(window.location.search).get('aba') === 'obrigacoes' ? 'obrigacoes' : 'recebimentos'));
    return (
        <div className={styles.page}>
            <PageHeader title="Fiscal" subtitle="Recebimentos, NFS-e e obrigações" />
            <div className={styles.tabs} role="tablist">
                {TABS.map(([k, label]) => (
                    <button key={k} type="button" role="tab" aria-selected={tab === k} className={`${styles.tab} ${tab === k ? styles.tab_active : ''}`} onClick={() => setTab(k)}>{label}</button>
                ))}
            </div>
            {tab === 'recebimentos' ? <Recebimentos /> : <Obrigacoes />}
        </div>
    );
}
