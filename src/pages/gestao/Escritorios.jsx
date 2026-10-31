import { useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from '../../components/ui/ui.module.css';
import { Banner, Button, Empty, Field, FilterBar, Input, Loading, Modal, PageHeader, Pill, Row, Select, StatusPill, Table } from '../../components/ui';
import { fmtDate, fmtDateTime } from '../../utils/format';
import ActionModal from '../../components/gestao/ActionModal';
import { SUB_STATE, backofficeApi, orgActionsFor } from '../../services/backoffice';
import useLoader from '../../hooks/useLoader';

// Detalhe do escritório num modal grande; as ações (motivo obrigatório) abrem outro modal por cima — o Esc fecha só o de cima
function Detalhe({ id, areas, onClose, onChanged }) {
    const { data, error, reload } = useLoader(() => backofficeApi.organization(id), [id]);
    const [action, setAction] = useState(null);
    const run = async (body) => {
        await backofficeApi.orgAction(id, body);
        toast.success('Ação registrada.');
        reload();
        onChanged();
    };
    const actions = data ? orgActionsFor(areas, data) : [];
    return (
        <Modal title={data?.nome || 'Escritório'} size="xl" onClose={onClose}
            footer={<>
                {actions.map((a) => (
                    <Button key={a.key} variant={a.danger ? 'danger' : 'default'} onClick={() => setAction(a)}>{a.label}</Button>
                ))}
                <Button className={styles.ml_auto} onClick={onClose}>Fechar</Button>
            </>}>
            {error && <Banner tone="error">{error}</Banner>}
            {!data && !error && <Loading />}
            {data && (<>
                <div className={styles.muted}>{data.plano} · criado em {fmtDate(data.criado_em)}</div>
                <Row gap={1}>
                    <StatusPill map={SUB_STATE} value={data.estado} />
                    {!data.ativo && <Pill tone="red">Desativado</Pill>}
                    {data.stripe && <Pill tone="blue">Assinatura no Stripe</Pill>}
                </Row>
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
                <div className={`${styles.section_title} ${styles.mb_0}`}>Equipe</div>
                <Table flat columns={['E-mail', 'Nome', 'Papel', 'Situação', 'Último acesso']}>
                    {data.equipe.map((m) => (
                        <tr key={m.id}>
                            <td>{m.email}</td>
                            <td data-label="Nome">{m.nome || '—'}</td>
                            <td data-label="Papel">{m.papel}</td>
                            <td data-label="Situação">{m.ativo ? <Pill tone="green">Ativo</Pill> : <Pill tone="gray">Inativo</Pill>}</td>
                            <td data-label="Último acesso">{fmtDateTime(m.ultimo_acesso)}</td>
                        </tr>
                    ))}
                </Table>
            </>)}
            {action && <ActionModal title={action.label} subject={data.nome} actionKey={action.key} spec={action}
                onRun={run} onClose={() => setAction(null)} />}
        </Modal>
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
            <FilterBar as="form" onSubmit={(e) => { e.preventDefault(); set({ q: term.trim() }); }}>
                <Field label="Buscar por nome">
                    <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Nome do escritório" />
                </Field>
                <Field label="Estado">
                    <Select value={estado} onChange={(e) => set({ estado: e.target.value })}>
                        <option value="">Todos</option>
                        {Object.entries(SUB_STATE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </Select>
                </Field>
                <Button type="submit">Buscar</Button>
            </FilterBar>
            {error && <Banner tone="error">{error}</Banner>}
            {!data && !error && <Loading />}
            {data && (
                <Table columns={['Escritório', 'Plano', 'Estado', 'Membros', 'Teste até', 'Criado']}
                    empty={data.resultados.length === 0 && <Empty>Nenhum escritório encontrado.</Empty>}>
                    {data.resultados.map((o) => (
                        <tr key={o.id} className={styles.clickable} tabIndex={0}
                            onClick={() => setSelected(o.id)} onKeyDown={(e) => e.key === 'Enter' && setSelected(o.id)}>
                            <td><strong>{o.nome}</strong>{!o.ativo && <> <Pill tone="red">Desativado</Pill></>}</td>
                            <td data-label="Plano">{o.plano}</td>
                            <td data-label="Estado"><StatusPill map={SUB_STATE} value={o.estado} /></td>
                            <td data-label="Membros">{o.membros}</td>
                            <td data-label="Teste até">{fmtDate(o.trial_ate)}</td>
                            <td data-label="Criado">{fmtDate(o.criado_em)}</td>
                        </tr>
                    ))}
                </Table>
            )}
            {data && data.total > 50 && (
                <div className={styles.pager}>
                    <span>{offset + 1}–{Math.min(offset + 50, data.total)} de {data.total}</span>
                    <Button disabled={offset === 0} onClick={() => set({ offset: Math.max(offset - 50, 0) })}>Anterior</Button>
                    <Button disabled={offset + 50 >= data.total} onClick={() => set({ offset: offset + 50 })}>Próxima</Button>
                </div>
            )}
            {selected && <Detalhe id={selected} areas={areas} onClose={() => setSelected(null)} onChanged={reload} />}
        </div>
    );
}
