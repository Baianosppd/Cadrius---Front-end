import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiDownload, FiTrash2 } from 'react-icons/fi';
import styles from '../seguranca/seguranca.module.css';
import { Banner, Empty, errorMessage, fmtDate, Loading, Pill, StatCard } from '../seguranca/ui';
import useLoader from '../../pages/gestao/useLoader';
import { brl, financeApi } from '../../services/cad223';
import { EXPENSE_CATEGORIES } from '../../services/carteira';

const AGING = { a_vencer: 'A vencer', '1_30': '1 a 30 dias', '31_60': '31 a 60 dias', '61_90': '61 a 90 dias', '90_mais': 'Mais de 90 dias' };
const pct = (v, max) => Math.max(2, Math.round((100 * Math.abs(v)) / Math.max(1, max)));
const monthLabel = (iso) => iso.split('-').reverse().join('/');

// Fluxo de caixa projetado (CAD-223)
export function FluxoCaixa() {
    const [semanas, setSemanas] = useState(12);
    const { data, error } = useLoader(() => financeApi.cashFlow(semanas), [semanas]);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    const max = Math.max(1, ...data.semanas.flatMap((s) => [s.entradas, s.saidas]));
    return (
        <div className={styles.stack}>
            <div className={styles.btn_row}>
                {[8, 12, 26].map((n) => <button key={n} type="button" className={`${styles.chip} ${semanas === n ? styles.chip_active : ''}`} onClick={() => setSemanas(n)}>{n} semanas</button>)}
            </div>
            <div className={styles.grid}>
                <StatCard title="Entradas previstas" value={brl(data.entradas_centavos)} tone="green" />
                <StatCard title="Saídas previstas" value={brl(data.saidas_centavos)} note="Despesas lançadas + despesas fixas" />
                <StatCard title="Saldo do período" value={brl(data.entradas_centavos - data.saidas_centavos)}
                    tone={data.entradas_centavos - data.saidas_centavos < 0 ? 'red' : 'green'} />
                <StatCard title="Vencido (fora da previsão)" value={brl(data.vencido_centavos)} tone={data.vencido_centavos ? 'red' : undefined} />
            </div>
            <div className={styles.card}>
                <div className={styles.card_title}>Semana a semana</div>
                {data.semanas.map((s) => (
                    <div key={s.semana} className={styles.bar_row}>
                        <span className={styles.bar_label}>{fmtDate(s.semana).slice(0, 5)}</span>
                        <div className={styles.bar_track}>
                            <div className={styles.bar_in} style={{ width: `${s.entradas ? pct(s.entradas, max) : 0}%` }} title={`Entradas ${brl(s.entradas)}`} />
                            <div className={styles.bar_out} style={{ width: `${s.saidas ? pct(s.saidas, max) : 0}%` }} title={`Saídas ${brl(s.saidas)}`} />
                        </div>
                        <span className={styles.muted} style={{ color: s.saldo_acumulado < 0 ? 'var(--c-danger)' : undefined }}>acum. {brl(s.saldo_acumulado)}</span>
                    </div>
                ))}
                <p className={styles.muted} style={{ marginTop: 12 }}>{data.aviso}</p>
            </div>
        </div>
    );
}

// Meta do mês, inadimplência por faixa e DRE (CAD-223)
export function Indicadores({ canEdit }) {
    const [ano, setAno] = useState(new Date().getFullYear());
    const { data, error, reload } = useLoader(() => financeApi.indicators(ano), [ano]);
    const [meta, setMeta] = useState('');
    const saveGoal = async () => {
        try { await financeApi.saveConfig({ meta_mensal: meta }); setMeta(''); toast.success('Meta salva.'); reload(); } catch (e) { toast.error(errorMessage(e)); }
    };
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    const g = data.meta;
    const maxDre = Math.max(1, ...data.dre.meses.flatMap((m) => [m.receitas, m.despesas]));
    return (
        <div className={styles.stack}>
            <div className={styles.card_grid}>
                <div className={styles.card}>
                    <div className={styles.card_title}>Meta de faturamento do mês</div>
                    {g.meta_centavos ? (
                        <>
                            <div className={styles.card_value}>{g.pct}%</div>
                            <div className={styles.bar_track} style={{ marginTop: 8 }}><div className={styles.bar_in} style={{ width: `${Math.min(100, g.pct)}%` }} /></div>
                            <p className={styles.muted}>Recebido {brl(g.recebido_centavos)} de {brl(g.meta_centavos)}. Ainda previsto no mês: {brl(g.previsto_restante_centavos)} (projeção {g.projecao_pct}%).</p>
                        </>
                    ) : <p className={styles.muted}>Defina uma meta para acompanhar o mês (e use o gatilho "Acompanhamento da meta do mês").</p>}
                    {canEdit && (
                        <div className={styles.btn_row} style={{ marginTop: 8 }}>
                            <input className={styles.input} style={{ maxWidth: 180 }} inputMode="decimal" aria-label="Meta mensal" placeholder="Ex.: 30.000,00" value={meta} onChange={(e) => setMeta(e.target.value)} />
                            <button type="button" className={styles.btn} disabled={!meta} onClick={saveGoal}>Salvar meta</button>
                        </div>
                    )}
                </div>
                <div className={styles.card}>
                    <div className={styles.card_title}>Inadimplência por faixa</div>
                    {data.inadimplencia.map((a) => (
                        <div key={a.faixa} className={styles.list_row}>
                            <span>{AGING[a.faixa]}</span>
                            <span><strong>{brl(a.centavos)}</strong> <span className={styles.muted}>({a.parcelas})</span></span>
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles.card}>
                <div className={styles.btn_row} style={{ justifyContent: 'space-between' }}>
                    <div className={styles.card_title}>Demonstrativo de resultado (caixa) — {data.dre.ano}</div>
                    <div className={styles.btn_row}>
                        <button type="button" className={`${styles.btn} ${styles.btn_sm}`} onClick={() => setAno(ano - 1)}>{ano - 1}</button>
                        {ano < new Date().getFullYear() && <button type="button" className={`${styles.btn} ${styles.btn_sm}`} onClick={() => setAno(ano + 1)}>{ano + 1}</button>}
                    </div>
                </div>
                <div className={styles.grid} style={{ marginTop: 8 }}>
                    <StatCard title="Receitas" value={brl(data.dre.receitas)} tone="green" />
                    <StatCard title="Despesas" value={brl(data.dre.despesas)} />
                    <StatCard title="Resultado" value={brl(data.dre.resultado)} tone={data.dre.resultado < 0 ? 'red' : 'green'}
                        note={data.dre.margem_pct != null ? `margem ${data.dre.margem_pct}%` : ''} />
                </div>
                {data.dre.meses.filter((m) => m.receitas || m.despesas).map((m) => (
                    <div key={m.mes} className={styles.bar_row}>
                        <span className={styles.bar_label}>{monthLabel(m.mes)}</span>
                        <div className={styles.bar_track}>
                            <div className={styles.bar_in} style={{ width: `${m.receitas ? pct(m.receitas, maxDre) : 0}%` }} />
                            <div className={styles.bar_out} style={{ width: `${m.despesas ? pct(m.despesas, maxDre) : 0}%` }} />
                        </div>
                        <span className={styles.muted}>{brl(m.resultado)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Fiscal do escritório: regime, estimativa, notas pendentes e pacote do contador (CAD-223)
export function FiscalEscritorio({ canEdit }) {
    const [mes, setMes] = useState(new Date().toISOString().slice(0, 7));
    const { data, error, reload } = useLoader(() => financeApi.fiscal(mes), [mes]);
    const [cfg, setCfg] = useState(null);
    const [range, setRange] = useState(() => {
        const d = new Date();
        return { inicio: new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().slice(0, 10), fim: new Date(d.getFullYear(), d.getMonth(), 0).toISOString().slice(0, 10) };
    });
    const save = async () => {
        try { await financeApi.saveConfig(cfg); toast.success('Configuração fiscal salva.'); setCfg(null); reload(); } catch (e) { toast.error(errorMessage(e)); }
    };
    const download = async () => {
        try {
            const res = await financeApi.accountantCsv(range.inicio, range.fim);
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url; a.download = `contador-${range.inicio}-${range.fim}.csv`; a.click();
            URL.revokeObjectURL(url);
        } catch (e) { toast.error(errorMessage(e)); }
    };
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    const c = data.config;
    const est = data.estimativa;
    return (
        <div className={styles.stack}>
            <div className={styles.filters}>
                <label className={styles.field}>Mês<input className={styles.input} type="month" value={mes} onChange={(e) => setMes(e.target.value)} /></label>
            </div>
            <div className={styles.grid}>
                <StatCard title="Receita do mês" value={brl(data.receita_centavos)} note="Honorários recebidos (regime de caixa)" />
                <StatCard title="De pessoas físicas" value={brl(data.pessoa_fisica_centavos)} />
                <StatCard title="De empresas" value={brl(data.pessoa_juridica_centavos)} />
                <StatCard title="Receita 12 meses (RBT12)" value={brl(data.rbt12_centavos)} />
                <StatCard title="Recebimentos sem nota" value={data.sem_nota} tone={data.sem_nota ? 'red' : 'green'} note="Emita em A receber → Pagos" />
            </div>
            <div className={styles.card}>
                <div className={styles.card_title}>Estimativa de impostos — {est.regime_label}</div>
                {est.alerta && <Banner tone="warn">{est.alerta}</Banner>}
                {est.itens.length === 0 && <p className={styles.muted}>Escolha o regime tributário abaixo para ver a estimativa.</p>}
                {est.itens.map((i) => (
                    <div key={i.nome} className={styles.list_row}><span>{i.nome}</span><strong>{i.centavos == null ? '—' : brl(i.centavos)}</strong></div>
                ))}
                {est.total_centavos > 0 && <div className={styles.list_row}><span>Total estimado</span><strong>{brl(est.total_centavos)}</strong></div>}
                {est.dica && <p className={styles.muted}>{est.dica}</p>}
                <p className={styles.muted}>{data.aviso}</p>
            </div>
            <div className={styles.card_grid}>
                <div className={styles.card}>
                    <div className={styles.card_title}>Pacote do contador</div>
                    <p className={styles.muted}>Planilha com recebimentos (com CPF/CNPJ do pagador, exigido no Carnê-Leão) e despesas. O download fica registrado na auditoria.</p>
                    <div className={styles.filters}>
                        <label className={styles.field}>De<input className={styles.input} type="date" value={range.inicio} onChange={(e) => setRange({ ...range, inicio: e.target.value })} /></label>
                        <label className={styles.field}>Até<input className={styles.input} type="date" value={range.fim} onChange={(e) => setRange({ ...range, fim: e.target.value })} /></label>
                    </div>
                    <button type="button" className={styles.btn} onClick={download}><FiDownload aria-hidden="true" /> Baixar planilha</button>
                    {c.email_contador && <p className={styles.muted}>Contador: {c.email_contador}</p>}
                </div>
                <div className={styles.card}>
                    <div className={styles.card_title}>Configuração fiscal</div>
                    {!cfg ? (
                        <>
                            <p className={styles.muted}>Regime: {c.regimes.find((r) => r[0] === c.regime)?.[1]} · ISS {c.iss_pct}%
                                {c.codigo_servico_municipal ? ` · serviço ${c.codigo_servico_municipal}` : ''}</p>
                            <p className={styles.muted}>Notas de honorários saem pelo Asaas (Integrações) com o serviço municipal configurado aqui.</p>
                            {canEdit && <button type="button" className={styles.btn} onClick={() => setCfg({ regime: c.regime, iss_pct: c.iss_pct, descricao_servico: c.descricao_servico,
                                codigo_servico_municipal: c.codigo_servico_municipal, nome_servico_municipal: c.nome_servico_municipal, email_contador: c.email_contador })}>Editar</button>}
                        </>
                    ) : (
                        <div className={styles.stack}>
                            <label className={styles.field}>Regime tributário<select className={styles.select} value={cfg.regime} onChange={(e) => setCfg({ ...cfg, regime: e.target.value })}>
                                {c.regimes.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
                            <label className={styles.field}>ISS (%)<input className={styles.input} inputMode="decimal" value={cfg.iss_pct} onChange={(e) => setCfg({ ...cfg, iss_pct: e.target.value })} /></label>
                            <label className={styles.field}>Descrição do serviço na nota<input className={styles.input} value={cfg.descricao_servico} onChange={(e) => setCfg({ ...cfg, descricao_servico: e.target.value })} /></label>
                            <label className={styles.field}>Código do serviço municipal (ex.: 17.14)<input className={styles.input} value={cfg.codigo_servico_municipal} onChange={(e) => setCfg({ ...cfg, codigo_servico_municipal: e.target.value })} /></label>
                            <label className={styles.field}>Nome do serviço municipal<input className={styles.input} value={cfg.nome_servico_municipal} onChange={(e) => setCfg({ ...cfg, nome_servico_municipal: e.target.value })} /></label>
                            <label className={styles.field}>E-mail do contador<input className={styles.input} type="email" value={cfg.email_contador} onChange={(e) => setCfg({ ...cfg, email_contador: e.target.value })} /></label>
                            <div className={styles.btn_row}>
                                <button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={save}>Salvar</button>
                                <button type="button" className={styles.btn} onClick={() => setCfg(null)}>Cancelar</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <p className={styles.muted}>Sem Asaas? Veja NFE.io em <Link to="/integracoes">Integrações</Link> (emissão pela prefeitura/padrão nacional).</p>
        </div>
    );
}

// Despesas fixas lançadas sozinhas todo mês (CAD-223)
export function DespesasFixas({ canEdit }) {
    const { data, error, reload } = useLoader(() => financeApi.recurring(), []);
    const [f, setF] = useState({ descricao: '', categoria: 'escritorio', valor: '', dia: 5 });
    const add = async (e) => {
        e.preventDefault();
        try { await financeApi.addRecurring(f); setF({ descricao: '', categoria: 'escritorio', valor: '', dia: 5 }); toast.success('Despesa fixa cadastrada.'); reload(); } catch (err) { toast.error(errorMessage(err)); }
    };
    const toggle = async (r) => { try { await financeApi.updateRecurring(r.id, { ativa: !r.ativa }); reload(); } catch (err) { toast.error(errorMessage(err)); } };
    const remove = async (r) => {
        if (!window.confirm(`Parar e apagar "${r.descricao}"? As despesas já lançadas continuam.`)) return;
        try { await financeApi.removeRecurring(r.id); reload(); } catch (err) { toast.error(errorMessage(err)); }
    };
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    return (
        <div className={styles.stack}>
            <Banner tone="info">Aluguel, sistemas, contador, internet… O Cadrius lança cada despesa no dia escolhido de todo mês (e ela entra no fluxo de caixa e no gatilho "Despesa lançada"). Total ativo: <strong>{brl(data.total_mensal_centavos)}</strong>/mês.</Banner>
            {canEdit && (
                <form className={styles.card} onSubmit={add}>
                    <div className={styles.filters}>
                        <label className={styles.field}>Descrição<input className={styles.input} required value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} placeholder="Aluguel da sala" /></label>
                        <label className={styles.field}>Categoria<select className={styles.select} value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })}>
                            {EXPENSE_CATEGORIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
                        <label className={styles.field}>Valor<input className={styles.input} required inputMode="decimal" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} placeholder="2.500,00" /></label>
                        <label className={styles.field}>Dia do mês<input className={styles.input} type="number" min={1} max={28} value={f.dia} onChange={(e) => setF({ ...f, dia: e.target.value })} /></label>
                    </div>
                    <button type="submit" className={`${styles.btn} ${styles.btn_primary}`}>Adicionar despesa fixa</button>
                </form>
            )}
            <div className={styles.table_wrap}>
                <table className={styles.table}>
                    <thead><tr><th>Despesa</th><th>Valor</th><th>Dia</th><th>Situação</th><th></th></tr></thead>
                    <tbody>
                        {data.resultados.length === 0 && <tr><td colSpan={5}><Empty>Nenhuma despesa fixa.</Empty></td></tr>}
                        {data.resultados.map((r) => (
                            <tr key={r.id}>
                                <td><strong>{r.descricao}</strong><div className={styles.muted}>{r.categoria_label}{r.ultimo_mes ? ` · último lançamento ${monthLabel(r.ultimo_mes)}` : ''}</div></td>
                                <td>{brl(r.valor_centavos)}</td>
                                <td>dia {r.dia}</td>
                                <td><Pill tone={r.ativa ? 'green' : 'gray'}>{r.ativa ? 'Ativa' : 'Pausada'}</Pill></td>
                                <td>{canEdit && (
                                    <div className={styles.btn_row}>
                                        <button type="button" className={`${styles.btn} ${styles.btn_sm}`} onClick={() => toggle(r)}>{r.ativa ? 'Pausar' : 'Retomar'}</button>
                                        <button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_danger}`} aria-label={`Apagar ${r.descricao}`} onClick={() => remove(r)}><FiTrash2 aria-hidden="true" /></button>
                                    </div>
                                )}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
