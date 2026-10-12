import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiDownload, FiTrash2 } from 'react-icons/fi';
import styles from '../ui/ui.module.css';
import f from './Financas.module.css';
import { Banner, Button, Chip, Empty, Field, FilterBar, Input, Loading, MoneyInput, Pill, Row, Select, Stack, StatCard, Table } from '../ui';
import { errorMessage, fmtDate } from '../../utils/format';
import useLoader from '../../hooks/useLoader';
import { brl, financeApi } from '../../services/cad223';
import { EXPENSE_CATEGORIES } from '../../services/carteira';

const AGING = { a_vencer: 'A vencer', '1_30': '1 a 30 dias', '31_60': '31 a 60 dias', '61_90': '61 a 90 dias', '90_mais': 'Mais de 90 dias' };
const pct = (v, max) => Math.max(2, Math.round((100 * Math.abs(v)) / Math.max(1, max)));
const monthLabel = (iso) => iso.split('-').reverse().join('/');

// Barra dupla entradas × saídas (a largura depende do valor: fica inline)
function BarRow({ label, inPct, outPct, inTitle, outTitle, children }) {
    return (
        <div className={styles.bar_row}>
            <span className={styles.bar_label}>{label}</span>
            <div className={styles.bar_track}>
                <div className={styles.bar_in} style={{ width: `${inPct}%` }} title={inTitle} />
                <div className={styles.bar_out} style={{ width: `${outPct}%` }} title={outTitle} />
            </div>
            {children}
        </div>
    );
}

// Fluxo de caixa projetado (CAD-223)
export function FluxoCaixa() {
    const [semanas, setSemanas] = useState(12);
    const { data, error } = useLoader(() => financeApi.cashFlow(semanas), [semanas]);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    const max = Math.max(1, ...data.semanas.flatMap((s) => [s.entradas, s.saidas]));
    return (
        <Stack>
            <Row role="group" aria-label="Período">
                {[8, 12, 26].map((n) => <Chip key={n} active={semanas === n} onClick={() => setSemanas(n)}>{n} semanas</Chip>)}
            </Row>
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
                    <BarRow key={s.semana} label={fmtDate(s.semana).slice(0, 5)}
                        inPct={s.entradas ? pct(s.entradas, max) : 0} outPct={s.saidas ? pct(s.saidas, max) : 0}
                        inTitle={`Entradas ${brl(s.entradas)}`} outTitle={`Saídas ${brl(s.saidas)}`}>
                        <span className={`${styles.muted} ${s.saldo_acumulado < 0 ? styles.text_danger : ''}`}>acum. {brl(s.saldo_acumulado)}</span>
                    </BarRow>
                ))}
                <p className={`${styles.muted} ${styles.mt_3} ${styles.mb_0}`}>{data.aviso}</p>
            </div>
        </Stack>
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
        <Stack>
            <div className={styles.card_grid}>
                <Stack gap={2} className={styles.card}>
                    <div className={styles.card_title}>Meta de faturamento do mês</div>
                    {g.meta_centavos ? (
                        <>
                            <div className={styles.card_value}>{g.pct}%</div>
                            {/* A largura da barra depende do quanto da meta foi atingido */}
                            <div className={styles.bar_track}><div className={styles.bar_in} style={{ width: `${Math.min(100, g.pct)}%` }} /></div>
                            <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>Recebido {brl(g.recebido_centavos)} de {brl(g.meta_centavos)}. Ainda previsto no mês: {brl(g.previsto_restante_centavos)} (projeção {g.projecao_pct}%).</p>
                        </>
                    ) : <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>Defina uma meta para acompanhar o mês (e use o gatilho "Acompanhamento da meta do mês").</p>}
                    {canEdit && (
                        <Row>
                            <MoneyInput className={f.goal_input} aria-label="Meta mensal (R$)" value={meta} onChange={setMeta} />
                            <Button disabled={!meta} onClick={saveGoal}>Salvar meta</Button>
                        </Row>
                    )}
                </Stack>
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
            <Stack gap={3} className={styles.card}>
                <Row justify="between">
                    <div className={`${styles.card_title} ${styles.mb_0}`}>Demonstrativo de resultado (caixa) — {data.dre.ano}</div>
                    <Row gap={1}>
                        <Button size="sm" onClick={() => setAno(ano - 1)}>{ano - 1}</Button>
                        {ano < new Date().getFullYear() && <Button size="sm" onClick={() => setAno(ano + 1)}>{ano + 1}</Button>}
                    </Row>
                </Row>
                <div className={styles.grid}>
                    <StatCard title="Receitas" value={brl(data.dre.receitas)} tone="green" />
                    <StatCard title="Despesas" value={brl(data.dre.despesas)} />
                    <StatCard title="Resultado" value={brl(data.dre.resultado)} tone={data.dre.resultado < 0 ? 'red' : 'green'}
                        note={data.dre.margem_pct != null ? `margem ${data.dre.margem_pct}%` : ''} />
                </div>
                <div>
                    {data.dre.meses.filter((m) => m.receitas || m.despesas).map((m) => (
                        <BarRow key={m.mes} label={monthLabel(m.mes)}
                            inPct={m.receitas ? pct(m.receitas, maxDre) : 0} outPct={m.despesas ? pct(m.despesas, maxDre) : 0}>
                            <span className={styles.muted}>{brl(m.resultado)}</span>
                        </BarRow>
                    ))}
                </div>
            </Stack>
        </Stack>
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
    const setC = (k) => (e) => setCfg({ ...cfg, [k]: e.target.value });
    return (
        <Stack>
            <FilterBar>
                <Field label="Mês" className={f.period_field}><Input type="month" value={mes} onChange={(e) => setMes(e.target.value)} /></Field>
            </FilterBar>
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
                <Stack gap={3} className={styles.card}>
                    <div className={`${styles.card_title} ${styles.mb_0}`}>Pacote do contador</div>
                    <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>Planilha com recebimentos (com CPF/CNPJ do pagador, exigido no Carnê-Leão) e despesas. O download fica registrado na auditoria.</p>
                    <FilterBar>
                        <Field label="De"><Input type="date" value={range.inicio} onChange={(e) => setRange({ ...range, inicio: e.target.value })} /></Field>
                        <Field label="Até"><Input type="date" value={range.fim} onChange={(e) => setRange({ ...range, fim: e.target.value })} /></Field>
                    </FilterBar>
                    <Button icon={FiDownload} className={styles.w_fit} onClick={download}>Baixar planilha</Button>
                    {c.email_contador && <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>Contador: {c.email_contador}</p>}
                </Stack>
                <Stack gap={3} className={styles.card}>
                    <div className={`${styles.card_title} ${styles.mb_0}`}>Configuração fiscal</div>
                    {!cfg ? (
                        <>
                            <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>Regime: {c.regimes.find((r) => r[0] === c.regime)?.[1]} · ISS {c.iss_pct}%
                                {c.codigo_servico_municipal ? ` · serviço ${c.codigo_servico_municipal}` : ''}</p>
                            <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>Notas de honorários saem pelo Asaas (Integrações) com o serviço municipal configurado aqui.</p>
                            {canEdit && <Button className={styles.w_fit} onClick={() => setCfg({ regime: c.regime, iss_pct: c.iss_pct, descricao_servico: c.descricao_servico,
                                codigo_servico_municipal: c.codigo_servico_municipal, nome_servico_municipal: c.nome_servico_municipal, email_contador: c.email_contador })}>Editar</Button>}
                        </>
                    ) : (
                        <Stack gap={3}>
                            <Field label="Regime tributário">
                                <Select value={cfg.regime} onChange={setC('regime')}>{c.regimes.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>
                            </Field>
                            <Field label="ISS (%)"><Input inputMode="decimal" value={cfg.iss_pct} onChange={setC('iss_pct')} /></Field>
                            <Field label="Descrição do serviço na nota"><Input value={cfg.descricao_servico} onChange={setC('descricao_servico')} /></Field>
                            <Field label="Código do serviço municipal" hint="Ex.: 17.14"><Input value={cfg.codigo_servico_municipal} onChange={setC('codigo_servico_municipal')} /></Field>
                            <Field label="Nome do serviço municipal"><Input value={cfg.nome_servico_municipal} onChange={setC('nome_servico_municipal')} /></Field>
                            <Field label="E-mail do contador"><Input type="email" value={cfg.email_contador} onChange={setC('email_contador')} /></Field>
                            <Row>
                                <Button variant="primary" onClick={save}>Salvar</Button>
                                <Button onClick={() => setCfg(null)}>Cancelar</Button>
                            </Row>
                        </Stack>
                    )}
                </Stack>
            </div>
            <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>Sem Asaas? Veja NFE.io em <Link to="/integracoes">Integrações</Link> (emissão pela prefeitura/padrão nacional).</p>
        </Stack>
    );
}

// Despesas fixas lançadas sozinhas todo mês (CAD-223)
export function DespesasFixas({ canEdit }) {
    const { data, error, reload } = useLoader(() => financeApi.recurring(), []);
    const EMPTY = { descricao: '', categoria: 'escritorio', valor: '', dia: 5 };
    const [form, setForm] = useState(EMPTY);
    const add = async (e) => {
        e.preventDefault();
        try { await financeApi.addRecurring(form); setForm(EMPTY); toast.success('Despesa fixa cadastrada.'); reload(); } catch (err) { toast.error(errorMessage(err)); }
    };
    const toggle = async (r) => { try { await financeApi.updateRecurring(r.id, { ativa: !r.ativa }); reload(); } catch (err) { toast.error(errorMessage(err)); } };
    const remove = async (r) => {
        if (!window.confirm(`Parar e apagar "${r.descricao}"? As despesas já lançadas continuam.`)) return;
        try { await financeApi.removeRecurring(r.id); reload(); } catch (err) { toast.error(errorMessage(err)); }
    };
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    return (
        <Stack>
            <Banner tone="info">Aluguel, sistemas, contador, internet… O Cadrius lança cada despesa no dia escolhido de todo mês (e ela entra no fluxo de caixa e no gatilho "Despesa lançada"). Total ativo: <strong>{brl(data.total_mensal_centavos)}</strong>/mês.</Banner>
            {canEdit && (
                <Stack as="form" gap={3} className={styles.card} onSubmit={add}>
                    <FilterBar>
                        <Field label="Descrição"><Input required value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Aluguel da sala" /></Field>
                        <Field label="Categoria">
                            <Select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                                {EXPENSE_CATEGORIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                            </Select>
                        </Field>
                        <Field label="Valor (R$)"><MoneyInput required value={form.valor} onChange={(v) => setForm({ ...form, valor: v })} /></Field>
                        <Field label="Dia do mês"><Input type="number" min={1} max={28} value={form.dia} onChange={(e) => setForm({ ...form, dia: e.target.value })} /></Field>
                    </FilterBar>
                    <Button type="submit" variant="primary" className={styles.w_fit}>Adicionar despesa fixa</Button>
                </Stack>
            )}
            <Table columns={['Despesa', 'Valor', 'Dia', 'Situação', { label: '', className: styles.td_actions }]}
                empty={data.resultados.length === 0 && <Empty>Nenhuma despesa fixa.</Empty>}>
                {data.resultados.map((r) => (
                    <tr key={r.id}>
                        <td><strong>{r.descricao}</strong><div className={styles.muted}>{r.categoria_label}{r.ultimo_mes ? ` · último lançamento ${monthLabel(r.ultimo_mes)}` : ''}</div></td>
                        <td data-label="Valor">{brl(r.valor_centavos)}</td>
                        <td data-label="Dia">dia {r.dia}</td>
                        <td data-label="Situação"><Pill tone={r.ativa ? 'green' : 'gray'}>{r.ativa ? 'Ativa' : 'Pausada'}</Pill></td>
                        <td className={styles.td_actions}>{canEdit && (
                            <Row gap={1} wrap={false}>
                                <Button size="sm" onClick={() => toggle(r)}>{r.ativa ? 'Pausar' : 'Retomar'}</Button>
                                <Button size="sm" variant="danger" icon={FiTrash2} aria-label={`Apagar ${r.descricao}`} onClick={() => remove(r)} />
                            </Row>
                        )}</td>
                    </tr>
                ))}
            </Table>
        </Stack>
    );
}
