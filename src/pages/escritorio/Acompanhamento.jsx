import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from '../../components/seguranca/seguranca.module.css';
import { Banner, Empty, PageHeader, Pill, errorMessage, fmtDateTime } from '../../components/seguranca/ui';
import useAuth from '../../hooks/useAuth';
import useLoader from '../gestao/useLoader';
import { contactsApi } from '../../services/contacts';
import { casesApi } from '../../services/rules';

// Processos acompanhados (DataJud) e o cliente de cada um — destinatário das automações "andamento novo" (CAD-172)
export default function Acompanhamento() {
    const { role } = useAuth();
    const canWrite = role !== 'VIEWER';
    const { data, error, reload } = useLoader(() => Promise.all([casesApi.list(), contactsApi.list({ kind: 'cliente' })]), []);
    const [form, setForm] = useState({ cnj: '', label: '', cliente_id: '' });
    const [busy, setBusy] = useState(null);
    const act = async (key, fn, ok) => {
        setBusy(key);
        try { const r = await fn(); if (ok) toast.success(ok); reload(); return r; } catch (err) { toast.error(errorMessage(err)); return null; } finally { setBusy(null); }
    };
    const add = async (e) => {
        e.preventDefault();
        const r = await act('add', () => casesApi.add({ ...form, cliente_id: form.cliente_id || null }), 'Processo adicionado ao acompanhamento.');
        if (r) setForm({ cnj: '', label: '', cliente_id: '' });
    };
    if (error) return <div className={styles.page}><Banner tone="error">{error}</Banner></div>;
    const [cases, contacts] = data || [[], { resultados: [] }];
    const clients = contacts.resultados || [];
    return (
        <div className={styles.page}>
            <PageHeader title="Processos acompanhados" subtitle="Andamentos consultados no DataJud (CNJ) a cada hora; o cliente vinculado recebe os avisos das automações" />
            {canWrite && (
                <form className={styles.filters} onSubmit={add}>
                    <label className={styles.field}>Nº do processo (CNJ)<input className={styles.input} value={form.cnj} onChange={(e) => setForm({ ...form, cnj: e.target.value })} placeholder="0000000-00.0000.0.00.0000" required /></label>
                    <label className={styles.field}>Apelido interno<input className={styles.input} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} maxLength={120} /></label>
                    <label className={styles.field}>Cliente
                        <select className={styles.select} value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}>
                            <option value="">— sem cliente —</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </label>
                    <button type="submit" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy === 'add'}>Acompanhar</button>
                </form>
            )}
            {clients.length === 0 && data && <Banner tone="info">Cadastre os clientes em <Link to="/contatos">Contatos</Link> para vinculá-los aos processos.</Banner>}
            {!data && <Empty>Carregando…</Empty>}
            {data && cases.length === 0 && <Empty>Nenhum processo acompanhado.</Empty>}
            {cases.length > 0 && (
                <div className={styles.table_wrap}>
                    <table className={styles.table}>
                        <thead><tr><th>Processo</th><th>Cliente</th><th>Última consulta</th><th></th></tr></thead>
                        <tbody>
                            {cases.map((c) => (
                                <tr key={c.id}>
                                    <td><strong className={styles.mono}>{c.cnj}</strong> <Pill tone="blue">{c.tribunal}</Pill><div className={styles.muted}>{c.label}</div></td>
                                    <td>
                                        {canWrite ? (
                                            <select className={styles.select} value={c.cliente?.id || ''} aria-label={`Cliente de ${c.cnj}`}
                                                onChange={(e) => act(`cli-${c.id}`, () => casesApi.update(c.id, { cliente_id: e.target.value || null }), 'Cliente atualizado.')}>
                                                <option value="">— sem cliente —</option>
                                                {c.cliente && !clients.some((x) => x.id === c.cliente.id) && <option value={c.cliente.id}>{c.cliente.nome}</option>}
                                                {clients.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                                            </select>
                                        ) : (c.cliente?.nome || '—')}
                                    </td>
                                    <td>{c.last_checked_at ? fmtDateTime(c.last_checked_at) : 'ainda não consultado'}
                                        {c.last_error && <div className={styles.muted}>{c.last_error}</div>}</td>
                                    <td>{canWrite && (
                                        <div className={styles.btn_row}>
                                            <button type="button" className={styles.btn} disabled={busy === `chk-${c.id}`}
                                                onClick={() => act(`chk-${c.id}`, () => casesApi.checkNow(c.id)).then((r) => r && toast.info(r.error || `${r.new} andamento(s) novo(s).`))}>Consultar agora</button>
                                            <button type="button" className={`${styles.btn} ${styles.btn_danger}`}
                                                onClick={() => window.confirm(`Parar de acompanhar ${c.cnj}?`) && act(`rm-${c.id}`, () => casesApi.remove(c.id), 'Removido.')}>Remover</button>
                                        </div>
                                    )}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
