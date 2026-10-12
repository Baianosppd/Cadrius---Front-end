import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from '../../../components/ui/ui.module.css';
import { Banner, Button, Empty, Field, FilterBar, Input, Loading, PageHeader, Pill, Row, Select, Table } from '../../../components/ui';
import { errorMessage, fmtDateTime } from '../../../utils/format';
import useAuth from '../../../hooks/useAuth';
import useLoader from '../../../hooks/useLoader';
import { contactsApi } from '../../../services/contacts';
import { casesApi } from '../../../services/rules';

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
            <PageHeader title="Processos" subtitle="Andamentos do DataJud a cada hora" />
            {canWrite && (
                <FilterBar as="form" onSubmit={add}>
                    <Field label="Nº do processo (CNJ)">
                        <Input value={form.cnj} onChange={(e) => setForm({ ...form, cnj: e.target.value })} placeholder="0000000-00.0000.0.00.0000" required />
                    </Field>
                    <Field label="Apelido interno"><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} maxLength={120} /></Field>
                    <Field label="Cliente">
                        <Select value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}>
                            <option value="">— sem cliente —</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                    </Field>
                    <Button type="submit" variant="primary" loading={busy === 'add'}>Acompanhar</Button>
                </FilterBar>
            )}
            {clients.length === 0 && data && <Banner tone="info">Cadastre os clientes em <Link to="/contatos">Contatos</Link> para vinculá-los aos processos.</Banner>}
            {!data && <Loading />}
            {data && cases.length === 0 && <Empty title="Nenhum processo acompanhado">Informe o número CNJ acima: o Cadrius consulta o DataJud a cada hora e avisa os andamentos novos.</Empty>}
            {cases.length > 0 && (
                <Table columns={['Processo', 'Cliente', 'Última consulta', { label: '', className: styles.td_actions }]}>
                    {cases.map((c) => (
                        <tr key={c.id}>
                            <td><strong className={styles.mono}>{c.cnj}</strong> <Pill tone="blue">{c.tribunal}</Pill><div className={styles.muted}>{c.label}</div></td>
                            <td data-label="Cliente">
                                {canWrite ? (
                                    <Select value={c.cliente?.id || ''} aria-label={`Cliente de ${c.cnj}`}
                                        onChange={(e) => act(`cli-${c.id}`, () => casesApi.update(c.id, { cliente_id: e.target.value || null }), 'Cliente atualizado.')}>
                                        <option value="">— sem cliente —</option>
                                        {c.cliente && !clients.some((x) => x.id === c.cliente.id) && <option value={c.cliente.id}>{c.cliente.nome}</option>}
                                        {clients.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                                    </Select>
                                ) : (c.cliente?.nome || '—')}
                            </td>
                            <td data-label="Última consulta">{c.last_checked_at ? fmtDateTime(c.last_checked_at) : 'ainda não consultado'}
                                {c.last_error && <div className={styles.muted}>{c.last_error}</div>}</td>
                            <td className={styles.td_actions}>{canWrite && (
                                <Row gap={1} wrap={false}>
                                    <Button size="sm" loading={busy === `chk-${c.id}`} loadingLabel="Consultando…"
                                        onClick={() => act(`chk-${c.id}`, () => casesApi.checkNow(c.id)).then((r) => r && toast.info(r.error || `${r.new} andamento(s) novo(s).`))}>Consultar agora</Button>
                                    <Button size="sm" variant="danger"
                                        onClick={() => window.confirm(`Parar de acompanhar ${c.cnj}?`) && act(`rm-${c.id}`, () => casesApi.remove(c.id), 'Removido.')}>Remover</Button>
                                </Row>
                            )}</td>
                        </tr>
                    ))}
                </Table>
            )}
        </div>
    );
}
