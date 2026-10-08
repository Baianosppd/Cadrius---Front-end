import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from '../../components/seguranca/seguranca.module.css';
import { Banner, Empty, PageHeader, Pill, StatCard, errorMessage, fmtDate } from '../../components/seguranca/ui';
import useAuth from '../../hooks/useAuth';
import useLoader from '../gestao/useLoader';
import { ExpenseForm, ReceivableForm } from '../../components/carteira/Forms';
import { DespesasFixas, FiscalEscritorio, FluxoCaixa, Indicadores } from '../../components/financas/FinancePlus';
import { EXPENSE_CATEGORIES, METHODS, REC_STATUS, brl, carteiraApi, monthBars } from '../../services/carteira';

const CATEGORY = Object.fromEntries(EXPENSE_CATEGORIES);
const firstOfMonth = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); };
const todayIso = () => new Date().toISOString().slice(0, 10);

function Period({ value, onChange }) {
    return (
        <div className={styles.filters} style={{ justifyContent: 'flex-start' }}>
            <label className={styles.field} style={{ flex: '0 1 190px' }}>De<input className={styles.input} type="date" value={value.inicio} onChange={(e) => onChange({ ...value, inicio: e.target.value })} /></label>
            <label className={styles.field} style={{ flex: '0 1 190px' }}>Até<input className={styles.input} type="date" value={value.fim} onChange={(e) => onChange({ ...value, fim: e.target.value })} /></label>
        </div>
    );
}

function Painel() {
    const [period, setPeriod] = useState({ inicio: firstOfMonth(), fim: todayIso() });
    const { data, error } = useLoader(() => carteiraApi.summary(period), [period.inicio, period.fim]);
    return (
        <div className={styles.stack}>
            <Period value={period} onChange={setPeriod} />
            {error && <Banner tone="error">{error}</Banner>}
            {!data && !error && <Empty>Carregando…</Empty>}
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
                                <ul style={{ margin: 0, paddingLeft: 18 }}>{data.clientes.map((c) => (
                                    <li key={c.contato_id}>{c.nome}: {brl(c.recebido)}{c.despesas ? ` − ${brl(c.despesas)} = ${brl(c.margem)}` : ''}</li>
                                ))}</ul>
                            )}
                        </div>
                        <div className={styles.card}>
                            <div className={styles.card_title}>Despesas por categoria</div>
                            {data.por_categoria.length === 0 ? <Empty>Sem despesas no período.</Empty> : (
                                <ul style={{ margin: 0, paddingLeft: 18 }}>{data.por_categoria.map((c) => <li key={c.categoria}>{CATEGORY[c.categoria] || c.categoria}: {brl(c.centavos)}</li>)}</ul>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function PayModal({ rec, onClose, onDone }) {
    const [f, setF] = useState({ pago_em: todayIso(), forma: 'pix', valor: '' });
    const [busy, setBusy] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try { await carteiraApi.receivableAction(rec.id, 'baixa', f); toast.success('Pagamento registrado.'); onDone(); } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Registrar pagamento" onClick={onClose}>
            <form className={styles.modal} style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
                <div className={styles.modal_title}>Registrar pagamento</div>
                <p className={styles.muted}>{rec.descricao} — {brl(rec.valor_centavos)}</p>
                <div className={styles.filters}>
                    <label className={styles.field}>Pago em<input className={styles.input} type="date" value={f.pago_em} onChange={(e) => setF({ ...f, pago_em: e.target.value })} required /></label>
                    <label className={styles.field}>Forma<select className={styles.select} value={f.forma} onChange={(e) => setF({ ...f, forma: e.target.value })}>{METHODS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
                </div>
                <label className={styles.field}>Valor recebido (se diferente)<input className={styles.input} inputMode="decimal" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} placeholder={(rec.valor_centavos / 100).toFixed(2).replace('.', ',')} /></label>
                <div className={styles.btn_row}>
                    <button type="submit" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy}>Confirmar baixa</button>
                    <button type="button" className={styles.btn} onClick={onClose}>Cancelar</button>
                </div>
            </form>
        </div>
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
        <div className={styles.card}>
            <div className={styles.card_title}>Baixa automática pelo Asaas</div>
            <p className={styles.muted}>Com o webhook configurado, cada Pix/boleto pago no Asaas dá baixa sozinho aqui. Precisa do Asaas conectado em <Link to="/integracoes">Integrações</Link>.</p>
            {!cfg && <button type="button" className={styles.btn} onClick={load}>Ver dados do webhook</button>}
            {cfg && (
                <ol className={styles.muted} style={{ paddingLeft: 18 }}>
                    <li>No Asaas: Integrações → Webhooks → Adicionar.</li>
                    <li>URL: <code style={{ wordBreak: 'break-all' }}>{cfg.url}</code></li>
                    <li>Token de autenticação: <code style={{ wordBreak: 'break-all' }}>{cfg.token}</code> (não compartilhe)</li>
                    <li>Eventos de cobrança: {cfg.eventos.join(', ')}.</li>
                </ol>
            )}
        </div>
    );
}

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
        <div className={styles.stack}>
            <div className={styles.btn_row}>
                {[['aberto', 'Em aberto'], ['vencido', 'Vencidos'], ['pago', 'Pagos']].map(([k, l]) => (
                    <button key={k} type="button" className={`${styles.chip} ${filtro === k ? styles.chip_active : ''}`} onClick={() => setFiltro(k)}>{l}</button>
                ))}
                <button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={() => setCreating(true)}>Novo lançamento</button>
            </div>
            {error && <Banner tone="error">{error}</Banner>}
            {!data && !error && <Empty>Carregando…</Empty>}
            {data && (
                <div className={styles.table_wrap}>
                    <table className={styles.table}>
                        <thead><tr><th>Lançamento</th><th>Valor</th><th>Vencimento</th><th>Situação</th><th></th></tr></thead>
                        <tbody>
                            {data.resultados.length === 0 && <tr><td colSpan={5}><Empty>Nada aqui.</Empty></td></tr>}
                            {data.resultados.map((r) => (
                                <tr key={r.id}>
                                    <td><strong>{r.descricao}</strong><div className={styles.muted}>{r.contato?.nome}{r.processo ? ` · ${r.processo.cnj}` : ''}</div></td>
                                    <td>{brl(r.valor_centavos)}{r.status === 'pago' && r.pago_centavos !== r.valor_centavos && <div className={styles.muted}>pago {brl(r.pago_centavos)}</div>}</td>
                                    <td>{fmtDate(r.vencimento)}{r.pago_em && <div className={styles.muted}>pago {fmtDate(r.pago_em)}</div>}</td>
                                    <td><Pill tone={r.vencido ? 'red' : REC_STATUS[r.status]?.[1]}>{r.vencido ? `Vencido há ${r.dias_atraso}d` : REC_STATUS[r.status]?.[0]}</Pill>
                                        {r.no_asaas && <div className={styles.muted}>cobrança no Asaas</div>}</td>
                                    <td>
                                        <div className={styles.btn_row}>
                                            {r.status === 'aberto' && <button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_primary}`} onClick={() => setPaying(r)}>Dar baixa</button>}
                                            {r.status === 'aberto' && !r.no_asaas && <button type="button" className={`${styles.btn} ${styles.btn_sm}`} disabled={busy === r.id}
                                                onClick={() => act(r, 'cobrar', { forma: 'UNDEFINED' }, 'Cobrança criada no Asaas.')}>Gerar boleto/Pix</button>}
                                            {r.link_pagamento && <a className={`${styles.btn} ${styles.btn_sm}`} href={r.link_pagamento} target="_blank" rel="noreferrer noopener">Fatura</a>}
                                            {r.status === 'pago' && r.no_asaas && !r.nota && <button type="button" className={`${styles.btn} ${styles.btn_sm}`} disabled={busy === r.id}
                                                onClick={() => window.confirm('Pedir a nota fiscal (NFS-e) deste pagamento à prefeitura pelo Asaas?') && act(r, 'nota', null, 'Nota pedida. O status atualiza sozinho.')}>Emitir nota</button>}
                                            {r.nota && (r.nota.link ? <a className={`${styles.btn} ${styles.btn_sm}`} href={r.nota.link} target="_blank" rel="noreferrer noopener">Nota ({r.nota.status})</a>
                                                : <Pill tone="blue">Nota: {r.nota.status}</Pill>)}
                                            {r.status === 'pago' && <button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_ghost}`} onClick={() => act(r, 'reabrir', null, 'Lançamento reaberto.')}>Reabrir</button>}
                                            {r.status === 'aberto' && <button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_ghost}`}
                                                onClick={() => window.confirm('Cancelar este lançamento?') && act(r, 'cancelar', null, 'Lançamento cancelado.')}>Cancelar</button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <AsaasCard />
            {paying && <PayModal rec={paying} onClose={() => setPaying(null)} onDone={() => { setPaying(null); reload(); }} />}
            {creating && <ReceivableForm onClose={() => setCreating(false)} onDone={() => { setCreating(false); reload(); }} />}
        </div>
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
        <div className={styles.stack}>
            <div className={styles.btn_row}><button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={() => setCreating(true)}>Nova despesa</button></div>
            <Period value={period} onChange={setPeriod} />
            {error && <Banner tone="error">{error}</Banner>}
            {data && (
                <div className={styles.table_wrap}>
                    <table className={styles.table}>
                        <thead><tr><th>Despesa</th><th>Categoria</th><th>Valor</th><th>Data</th><th></th></tr></thead>
                        <tbody>
                            {data.resultados.length === 0 && <tr><td colSpan={5}><Empty>Nenhuma despesa no período.</Empty></td></tr>}
                            {data.resultados.map((e) => (
                                <tr key={e.id}>
                                    <td><strong>{e.descricao}</strong><div className={styles.muted}>{e.contato?.nome}{e.processo ? ` · ${e.processo.cnj}` : ''}</div></td>
                                    <td>{e.categoria_label}{e.reembolsavel && <div><Pill tone="blue">reembolsável</Pill></div>}</td>
                                    <td>{brl(e.valor_centavos)}</td>
                                    <td>{fmtDate(e.data)}</td>
                                    <td>{canDelete && <button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_ghost}`} onClick={() => remove(e)}>Apagar</button>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {creating && <ExpenseForm onClose={() => setCreating(false)} onDone={() => { setCreating(false); reload(); }} />}
        </div>
    );
}

// Finanças do escritório: honorários a receber, despesas/custas e resultado (CAD-175)
export default function Financas() {
    const { isOrgManager, access } = useAuth();
    // CAD-223: quem está num grupo com "Financeiro" também vê o painel; alterar depende de "ver e alterar"
    const perms = access?.permissoes || [];
    const seesFinance = isOrgManager || perms.includes('financeiro.ver');
    const canEdit = isOrgManager || perms.includes('financeiro.editar');
    const tabs = seesFinance ? [['painel', 'Painel'], ['fluxo', 'Fluxo de caixa'], ['receber', 'A receber'], ['despesas', 'Despesas e custas'],
        ['fixas', 'Despesas fixas'], ['indicadores', 'Metas e resultado'], ['fiscal', 'Fiscal e contador']] : [['despesas', 'Despesas e custas']];
    const [tab, setTab] = useState(tabs[0][0]);
    return (
        <div className={styles.page}>
            <PageHeader title="Finanças do escritório" subtitle="Receitas, cobranças e despesas" />
            {!seesFinance && <Banner tone="info">Você pode lançar despesas e custas. Valores a receber e o painel são vistos pelos donos, administradores e por quem tem o acesso "Financeiro".</Banner>}
            <div className={styles.tabs} role="tablist">
                {tabs.map(([k, label]) => (
                    <button key={k} type="button" role="tab" aria-selected={tab === k} className={`${styles.tab} ${tab === k ? styles.tab_active : ''}`} onClick={() => setTab(k)}>{label}</button>
                ))}
            </div>
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
