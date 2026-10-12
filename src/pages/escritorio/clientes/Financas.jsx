import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from '../../../components/ui/ui.module.css';
import f from '../../../components/financas/Financas.module.css';
import { Banner, Button, Chip, Empty, Field, FilterBar, FormModal, Input, Loading, MoneyInput, PageHeader, Pill, Row, Select, Stack, StatCard, Table, Tabs } from '../../../components/ui';
import { errorMessage, fmtDate } from '../../../utils/format';
import useAuth from '../../../hooks/useAuth';
import useLoader from '../../../hooks/useLoader';
import { ExpenseForm, ReceivableForm } from '../../../components/carteira/Forms';
import { DespesasFixas, FiscalEscritorio, FluxoCaixa, Indicadores } from '../../../components/financas/FinancePlus';
import { EXPENSE_CATEGORIES, METHODS, REC_STATUS, brl, carteiraApi, monthBars } from '../../../services/carteira';

const CATEGORY = Object.fromEntries(EXPENSE_CATEGORIES);
const firstOfMonth = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); };
const todayIso = () => new Date().toISOString().slice(0, 10);

function Period({ value, onChange }) {
    return (
        <FilterBar>
            <Field label="De" className={f.period_field}><Input type="date" value={value.inicio} onChange={(e) => onChange({ ...value, inicio: e.target.value })} /></Field>
            <Field label="Até" className={f.period_field}><Input type="date" value={value.fim} onChange={(e) => onChange({ ...value, fim: e.target.value })} /></Field>
        </FilterBar>
    );
}

function Painel() {
    const [period, setPeriod] = useState({ inicio: firstOfMonth(), fim: todayIso() });
    const { data, error } = useLoader(() => carteiraApi.summary(period), [period.inicio, period.fim]);
    return (
        <Stack>
            <Period value={period} onChange={setPeriod} />
            {error && <Banner tone="error">{error}</Banner>}
            {!data && !error && <Loading />}
            {data && (
                <>
                    <div className={styles.grid}>
                        <StatCard title="A receber" value={brl(data.a_receber_centavos)} note={`${brl(data.previsto_30_dias_centavos)} nos próximos 30 dias`} />
                        <StatCard title="Vencido" value={brl(data.vencido_centavos)} tone={data.vencidos ? 'red' : undefined}
                            note={`${data.vencidos} lançamento(s) · ${data.inadimplencia_pct}% do que está em aberto`} />
                        <StatCard title="Recebido no período" value={brl(data.recebido_centavos)} tone="green" />
                        <StatCard title="Despesas do escritório" value={brl(data.despesas_centavos)} note={`+ ${brl(data.reembolsaveis_centavos)} reembolsáveis pelos clientes`} />
                        <StatCard title="Resultado" value={brl(data.resultado_centavos)} tone={data.resultado_centavos < 0 ? 'red' : 'green'} note="Recebido − despesas do escritório" />
                    </div>
                    {data.por_mes.length > 0 && (
                        <div className={styles.card}>
                            <div className={styles.card_title}>Recebido × despesas por mês</div>
                            {monthBars(data.por_mes).map((m) => (
                                <div key={m.mes} className={styles.bar_row}>
                                    <span className={styles.bar_label}>{m.mes.split('-').reverse().join('/')}</span>
                                    {/* A largura das barras depende dos valores: fica inline */}
                                    <div className={styles.bar_track}>
                                        <div className={styles.bar_in} style={{ width: `${m.recebidoPct}%` }} title={`Recebido ${brl(m.recebido)}`} />
                                        <div className={styles.bar_out} style={{ width: `${m.despesasPct}%` }} title={`Despesas ${brl(m.despesas)}`} />
                                    </div>
                                    <span className={styles.muted}>{brl(m.recebido)} / {brl(m.despesas)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className={styles.card_grid}>
                        <div className={styles.card}>
                            <div className={styles.card_title}>Clientes que mais pagaram (margem)</div>
                            {data.clientes.length === 0 ? <Empty>Sem recebimentos no período.</Empty> : (
                                <ul className={styles.list_indent}>{data.clientes.map((c) => (
                                    <li key={c.contato_id}>{c.nome}: {brl(c.recebido)}{c.despesas ? ` − ${brl(c.despesas)} = ${brl(c.margem)}` : ''}</li>
                                ))}</ul>
                            )}
                        </div>
                        <div className={styles.card}>
                            <div className={styles.card_title}>Despesas por categoria</div>
                            {data.por_categoria.length === 0 ? <Empty>Sem despesas no período.</Empty> : (
                                <ul className={styles.list_indent}>{data.por_categoria.map((c) => <li key={c.categoria}>{CATEGORY[c.categoria] || c.categoria}: {brl(c.centavos)}</li>)}</ul>
                            )}
                        </div>
                    </div>
                </>
            )}
        </Stack>
    );
}

function PayModal({ rec, onClose, onDone }) {
    const [form, setForm] = useState({ pago_em: todayIso(), forma: 'pix', valor: '' });
    const [busy, setBusy] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try { await carteiraApi.receivableAction(rec.id, 'baixa', form); toast.success('Pagamento registrado.'); onDone(); } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    return (
        <FormModal title="Registrar pagamento" size="sm" onClose={onClose} onSubmit={submit} busy={busy} submitLabel="Confirmar baixa">
            <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>{rec.descricao} — {brl(rec.valor_centavos)}</p>
            <FilterBar>
                <Field label="Pago em"><Input type="date" value={form.pago_em} onChange={(e) => setForm({ ...form, pago_em: e.target.value })} required /></Field>
                <Field label="Forma">
                    <Select value={form.forma} onChange={(e) => setForm({ ...form, forma: e.target.value })}>{METHODS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>
                </Field>
            </FilterBar>
            <Field label="Valor recebido (R$)" hint={`Deixe vazio se recebeu o valor cheio (${brl(rec.valor_centavos)}).`}>
                <MoneyInput value={form.valor} onChange={(v) => setForm({ ...form, valor: v })} />
            </Field>
        </FormModal>
    );
}

function AsaasCard() {
    const [cfg, setCfg] = useState(null);
    const load = async () => {
        try { setCfg(await carteiraApi.asaasWebhook()); } catch (err) {
            toast.error(errorMessage(err));
        }
    };
    return (
        <Stack gap={2} className={styles.card}>
            <div className={`${styles.card_title} ${styles.mb_0}`}>Baixa automática pelo Asaas</div>
            <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>Com o webhook configurado, cada Pix/boleto pago no Asaas dá baixa sozinho aqui. Precisa do Asaas conectado em <Link to="/integracoes">Integrações</Link>.</p>
            {!cfg && <Button className={styles.w_fit} onClick={load}>Ver dados do webhook</Button>}
            {cfg && (
                <ol className={`${styles.muted} ${styles.list_indent}`}>
                    <li>No Asaas: Integrações → Webhooks → Adicionar.</li>
                    <li>URL: <code className={styles.break_all}>{cfg.url}</code></li>
                    <li>Token de autenticação: <code className={styles.break_all}>{cfg.token}</code> (não compartilhe)</li>
                    <li>Eventos de cobrança: {cfg.eventos.join(', ')}.</li>
                </ol>
            )}
        </Stack>
    );
}

const FILTROS = [['aberto', 'Em aberto'], ['vencido', 'Vencidos'], ['pago', 'Pagos']];

function AReceber() {
    const [filtro, setFiltro] = useState('aberto');
    const { data, error, reload } = useLoader(() => carteiraApi.receivables({ filtro }), [filtro]);
    const [paying, setPaying] = useState(null);
    const [creating, setCreating] = useState(false);
    const [busy, setBusy] = useState(null);
    const act = async (r, action, body, ok) => {
        setBusy(r.id);
        try { await carteiraApi.receivableAction(r.id, action, body); toast.success(ok); reload(); } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(null); }
    };
    return (
        <Stack>
            <Row justify="between">
                <Row role="group" aria-label="Filtrar lançamentos">
                    {FILTROS.map(([k, l]) => <Chip key={k} active={filtro === k} onClick={() => setFiltro(k)}>{l}</Chip>)}
                </Row>
                <Button variant="primary" onClick={() => setCreating(true)}>Novo lançamento</Button>
            </Row>
            {error && <Banner tone="error">{error}</Banner>}
            {!error && (
                <Table columns={['Lançamento', 'Valor', 'Vencimento', 'Situação', { label: '', className: styles.td_actions }]} loading={!data}
                    empty={data?.resultados.length === 0 && <Empty>Nada aqui.</Empty>}>
                    {data?.resultados.map((r) => (
                        <tr key={r.id}>
                            <td><strong>{r.descricao}</strong><div className={styles.muted}>{r.contato?.nome}{r.processo ? ` · ${r.processo.cnj}` : ''}</div></td>
                            <td data-label="Valor">{brl(r.valor_centavos)}{r.status === 'pago' && r.pago_centavos !== r.valor_centavos && <div className={styles.muted}>pago {brl(r.pago_centavos)}</div>}</td>
                            <td data-label="Vencimento">{fmtDate(r.vencimento)}{r.pago_em && <div className={styles.muted}>pago {fmtDate(r.pago_em)}</div>}</td>
                            <td data-label="Situação"><Pill tone={r.vencido ? 'red' : REC_STATUS[r.status]?.[1]}>{r.vencido ? `Vencido há ${r.dias_atraso}d` : REC_STATUS[r.status]?.[0]}</Pill>
                                {r.no_asaas && <div className={styles.muted}>cobrança no Asaas</div>}</td>
                            <td className={styles.td_actions}>
                                <Row gap={1}>
                                    {r.status === 'aberto' && <Button size="sm" variant="primary" onClick={() => setPaying(r)}>Dar baixa</Button>}
                                    {r.status === 'aberto' && !r.no_asaas && <Button size="sm" loading={busy === r.id}
                                        onClick={() => act(r, 'cobrar', { forma: 'UNDEFINED' }, 'Cobrança criada no Asaas.')}>Gerar boleto/Pix</Button>}
                                    {r.link_pagamento && <Button as="a" size="sm" href={r.link_pagamento} target="_blank" rel="noreferrer noopener">Fatura</Button>}
                                    {r.status === 'pago' && r.no_asaas && !r.nota && <Button size="sm" loading={busy === r.id}
                                        onClick={() => window.confirm('Pedir a nota fiscal (NFS-e) deste pagamento à prefeitura pelo Asaas?') && act(r, 'nota', null, 'Nota pedida. O status atualiza sozinho.')}>Emitir nota</Button>}
                                    {r.nota && (r.nota.link ? <Button as="a" size="sm" href={r.nota.link} target="_blank" rel="noreferrer noopener">Nota ({r.nota.status})</Button>
                                        : <Pill tone="blue">Nota: {r.nota.status}</Pill>)}
                                    {r.status === 'pago' && <Button size="sm" variant="ghost" onClick={() => act(r, 'reabrir', null, 'Lançamento reaberto.')}>Reabrir</Button>}
                                    {r.status === 'aberto' && <Button size="sm" variant="ghost"
                                        onClick={() => window.confirm('Cancelar este lançamento?') && act(r, 'cancelar', null, 'Lançamento cancelado.')}>Cancelar</Button>}
                                </Row>
                            </td>
                        </tr>
                    ))}
                </Table>
            )}
            <AsaasCard />
            {paying && <PayModal rec={paying} onClose={() => setPaying(null)} onDone={() => { setPaying(null); reload(); }} />}
            {creating && <ReceivableForm onClose={() => setCreating(false)} onDone={() => { setCreating(false); reload(); }} />}
        </Stack>
    );
}

function Despesas({ canDelete }) {
    const [period, setPeriod] = useState({ inicio: firstOfMonth(), fim: todayIso() });
    const { data, error, reload } = useLoader(() => carteiraApi.expenses(period), [period.inicio, period.fim]);
    const [creating, setCreating] = useState(false);
    const remove = async (e) => {
        if (!window.confirm('Apagar esta despesa?')) return;
        try { await carteiraApi.removeExpense(e.id); reload(); } catch (err) { toast.error(errorMessage(err)); }
    };
    return (
        <Stack>
            <Row justify="between" align="end">
                <Period value={period} onChange={setPeriod} />
                <Button variant="primary" onClick={() => setCreating(true)}>Nova despesa</Button>
            </Row>
            {error && <Banner tone="error">{error}</Banner>}
            {!error && (
                <Table columns={['Despesa', 'Categoria', 'Valor', 'Data', { label: '', className: styles.td_actions }]} loading={!data}
                    empty={data?.resultados.length === 0 && <Empty>Nenhuma despesa no período.</Empty>}>
                    {data?.resultados.map((e) => (
                        <tr key={e.id}>
                            <td><strong>{e.descricao}</strong><div className={styles.muted}>{e.contato?.nome}{e.processo ? ` · ${e.processo.cnj}` : ''}</div></td>
                            <td data-label="Categoria">{e.categoria_label}{e.reembolsavel && <div><Pill tone="blue">reembolsável</Pill></div>}</td>
                            <td data-label="Valor">{brl(e.valor_centavos)}</td>
                            <td data-label="Data">{fmtDate(e.data)}</td>
                            <td className={styles.td_actions}>{canDelete && <Button size="sm" variant="danger" onClick={() => remove(e)}>Apagar</Button>}</td>
                        </tr>
                    ))}
                </Table>
            )}
            {creating && <ExpenseForm onClose={() => setCreating(false)} onDone={() => { setCreating(false); reload(); }} />}
        </Stack>
    );
}

// Finanças do escritório: honorários a receber, despesas/custas e resultado (CAD-175)
export default function Financas() {
    const { isOrgManager, access } = useAuth();
    // CAD-223: quem está num grupo com "Financeiro" também vê o painel; alterar depende de "ver e alterar"
    const perms = access?.permissoes || [];
    const seesFinance = isOrgManager || perms.includes('financeiro.ver');
    const canEdit = isOrgManager || perms.includes('financeiro.editar');
    const tabs = seesFinance
        ? [{ id: 'painel', label: 'Painel' }, { id: 'fluxo', label: 'Fluxo de caixa' }, { id: 'receber', label: 'A receber' }, { id: 'despesas', label: 'Despesas e custas' },
            { id: 'fixas', label: 'Despesas fixas' }, { id: 'indicadores', label: 'Metas e resultado' }, { id: 'fiscal', label: 'Fiscal e contador' }]
        : [{ id: 'despesas', label: 'Despesas e custas' }];
    const [tab, setTab] = useState(tabs[0].id);
    return (
        <div className={styles.page}>
            <PageHeader title="Finanças" subtitle="Receitas, cobranças e despesas" />
            {!seesFinance && <Banner tone="info">Você pode lançar despesas e custas. Valores a receber e o painel são vistos pelos donos, administradores e por quem tem o acesso "Financeiro".</Banner>}
            <Tabs tabs={tabs} value={tab} onChange={setTab} />
            {tab === 'painel' && <Painel />}
            {tab === 'receber' && <AReceber />}
            {tab === 'despesas' && <Despesas canDelete={canEdit} />}
            {tab === 'fluxo' && <FluxoCaixa />}
            {tab === 'fixas' && <DespesasFixas canEdit={canEdit} />}
            {tab === 'indicadores' && <Indicadores canEdit={canEdit} />}
            {tab === 'fiscal' && <FiscalEscritorio canEdit={canEdit} />}
        </div>
    );
}
