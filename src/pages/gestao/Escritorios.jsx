import { useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from '../../components/seguranca/seguranca.module.css';
import { Banner, Empty, PageHeader, Pill, StatusPill, fmtDate, fmtDateTime } from '../../components/seguranca/ui';
import ActionModal from '../../components/gestao/ActionModal';
import { SUB_STATE, backofficeApi, orgActionsFor } from '../../services/backoffice';
import useLoader from './useLoader';

function Detalhe({ id, areas, onClose, onChanged }) {
    const { data, error, reload } = useLoader(() => backofficeApi.organization(id), [id]);
    const [action, setAction] = useState(null);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Empty>Carregando…</Empty>;
    const run = async (body) => {
        await backofficeApi.orgAction(id, body);
        toast.success('Ação registrada.');
        reload();
        onChanged();
    };
    return (
        <div className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <PageHeader title={data.nome} subtitle={`${data.plano} · criado em ${fmtDate(data.criado_em)}`}
                actions={<button type="button" className={styles.btn} onClick={onClose}>Fechar</button>} />
            <div className={styles.btn_row}>
                <StatusPill map={SUB_STATE} value={data.estado} />
                {!data.ativo && <Pill tone="red">Desativado</Pill>}
                {data.stripe && <Pill tone="blue">Assinatura no Stripe</Pill>}
            </div>
            <div className={styles.two_col}>
                <div>
                    <div className={styles.section_title}>Assinatura</div>
                    <div className={styles.kv}><span>Teste até</span><strong>{fmtDateTime(data.trial_ate)}</strong></div>
                    <div className={styles.kv}><span>Pagamento pendente desde</span><strong>{fmtDateTime(data.pendente_desde)}</strong></div>
                    <div className={styles.kv}><span>Período pago até</span><strong>{fmtDateTime(data.periodo_ate)}</strong></div>
                    <div className={styles.kv}><span>Usuários (limite atual)</span><strong>{data.membros} / {data.limite_usuarios}</strong></div>
                </div>
                <div>
                    <div className={styles.section_title}>Créditos</div>
                    <div className={styles.kv}><span>Usados no mês</span><strong>{data.creditos.mes_usados} / {data.creditos.mes_limite}</strong></div>
                    <div className={styles.kv}><span>Avulsos disponíveis</span><strong>{data.creditos.avulsos_disponiveis}</strong></div>
                    {data.adicional_midia && (
                        <div className={styles.kv}><span>Estúdio de mídia com IA</span><strong>
                            {data.adicional_midia.incluido_no_plano ? 'Incluído no plano' : data.adicional_midia.ativo
                                ? `${data.adicional_midia.origem === 'cortesia' ? 'Cortesia' : 'Contratado'}${data.adicional_midia.termina_em ? ` até ${fmtDate(data.adicional_midia.termina_em)}` : ''}`
                                : 'Não contratado'}</strong></div>
                    )}
                    {data.lotes.map((l, i) => (
                        <div key={i} className={styles.kv}><span>{l.origem === 'cortesia' ? 'Cortesia' : 'Compra'} · expira {fmtDate(l.expira)}</span>
                            <strong>{l.restantes}/{l.creditos}</strong></div>
                    ))}
                </div>
            </div>
            <div className={styles.section_title}>Equipe</div>
            <div className={styles.table_wrap}>
                <table className={styles.table}>
                    <thead><tr><th>E-mail</th><th>Nome</th><th>Papel</th><th>Situação</th><th>Último acesso</th></tr></thead>
                    <tbody>{data.equipe.map((m) => (
                        <tr key={m.id}><td>{m.email}</td><td>{m.nome || '—'}</td><td>{m.papel}</td>
                            <td>{m.ativo ? <Pill tone="green">Ativo</Pill> : <Pill tone="gray">Inativo</Pill>}</td><td>{fmtDateTime(m.ultimo_acesso)}</td></tr>
                    ))}</tbody>
                </table>
            </div>
            <div className={styles.btn_row}>
                {orgActionsFor(areas, data).map((a) => (
                    <button key={a.key} type="button" className={`${styles.btn} ${a.danger ? styles.btn_danger : ''}`} onClick={() => setAction(a)}>{a.label}</button>
                ))}
            </div>
            {action && <ActionModal title={action.label} subject={data.nome} actionKey={action.key} spec={action}
                onRun={run} onClose={() => setAction(null)} />}
        </div>
    );
}

export default function Escritorios() {
    const { areas } = useOutletContext();
    const [params, setParams] = useSearchParams();
    const [term, setTerm] = useState(params.get('q') || '');
    const [selected, setSelected] = useState(null);
    const estado = params.get('estado') || '';
    const q = params.get('q') || '';
    const offset = Number(params.get('offset') || 0);
    const { data, error, reload } = useLoader(() => backofficeApi.organizations({ q, estado, offset }), [q, estado, offset]);
    const set = (changes) => {
        const next = { q, estado, offset: 0, ...changes };
        setParams(Object.fromEntries(Object.entries(next).filter(([, v]) => v)));
    };
    return (
        <div className={styles.page}>
            <PageHeader title="Escritórios" subtitle="Assinatura, créditos e equipe" />
            <form className={styles.filters} onSubmit={(e) => { e.preventDefault(); set({ q: term.trim() }); }}>
                <label className={styles.field}>Buscar por nome
                    <input className={styles.input} value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Nome do escritório" />
                </label>
                <label className={styles.field}>Estado
                    <select className={styles.select} value={estado} onChange={(e) => set({ estado: e.target.value })}>
                        <option value="">Todos</option>
                        {Object.entries(SUB_STATE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                </label>
                <button type="submit" className={styles.btn}>Buscar</button>
            </form>
            {selected && <Detalhe id={selected} areas={areas} onClose={() => setSelected(null)} onChanged={reload} />}
            {error && <Banner tone="error">{error}</Banner>}
            {!data && !error && <Empty>Carregando…</Empty>}
            {data && (
                <div className={styles.table_wrap}>
                    <table className={styles.table}>
                        <thead><tr><th>Escritório</th><th>Plano</th><th>Estado</th><th>Membros</th><th>Teste até</th><th>Criado</th></tr></thead>
                        <tbody>
                            {data.resultados.length === 0 && <tr><td colSpan={6}><Empty>Nenhum escritório encontrado.</Empty></td></tr>}
                            {data.resultados.map((o) => (
                                <tr key={o.id} onClick={() => setSelected(o.id)} style={{ cursor: 'pointer' }}>
                                    <td><strong>{o.nome}</strong>{!o.ativo && <> <Pill tone="red">Desativado</Pill></>}</td>
                                    <td>{o.plano}</td><td><StatusPill map={SUB_STATE} value={o.estado} /></td>
                                    <td>{o.membros}</td><td>{fmtDate(o.trial_ate)}</td><td>{fmtDate(o.criado_em)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {data && data.total > 50 && (
                <div className={styles.pager}>
                    <span>{offset + 1}–{Math.min(offset + 50, data.total)} de {data.total}</span>
                    <button type="button" className={styles.btn} disabled={offset === 0} onClick={() => set({ offset: Math.max(offset - 50, 0) })}>Anterior</button>
                    <button type="button" className={styles.btn} disabled={offset + 50 >= data.total} onClick={() => set({ offset: offset + 50 })}>Próxima</button>
                </div>
            )}
        </div>
    );
}
