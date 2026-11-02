import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../ui/ui.module.css';
import { Banner, Button, Chip, Empty, Field, FilterBar, FormModal, Input, Loading, MoneyInput, Row, Stack, StatusPill, Textarea } from '../ui';
import { errorMessage, fmtDate, fmtDateTime } from '../../utils/format';
import useLoader from '../../hooks/useLoader';
import { STAFF_STAGE_NEXT, STAGES, brl, customizationApi } from '../../services/cad223';

// Gestão Cadrius → Suporte: fila de pedidos de parametrização (CAD-223)
export default function FilaParametrizacao({ onOpenTicket }) {
    const [etapa, setEtapa] = useState('');
    const { data, error, reload } = useLoader(() => customizationApi.staffList(etapa), [etapa]);
    const [editing, setEditing] = useState(null);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    return (
        <div className={styles.stack}>
            <Row gap={1} role="group" aria-label="Filtrar por etapa">
                <Chip active={!etapa} onClick={() => setEtapa('')}>Todos</Chip>
                {Object.entries(STAGES).map(([k, v]) => (
                    <Chip key={k} active={etapa === k} onClick={() => setEtapa(k)}>
                        {v.label} <span className={styles.count}>{data.por_etapa[k] || 0}</span></Chip>
                ))}
            </Row>
            {data.resultados.length === 0 && <Empty>Nenhum pedido.</Empty>}
            {data.resultados.map((r) => (
                <Stack key={r.id} gap={2} className={styles.card}>
                    <Row justify="between">
                        <strong>{r.escritorio} · {r.area_label}</strong><StatusPill map={STAGES} value={r.etapa} />
                    </Row>
                    <p className={`${styles.pre_wrap} ${styles.mt_0} ${styles.mb_0}`}>{r.objetivo}</p>
                    {r.exemplo && <p className={`${styles.muted} ${styles.pre_wrap} ${styles.mt_0} ${styles.mb_0}`}>Exemplo: {r.exemplo}</p>}
                    <div className={styles.muted}>{r.frequencia && `Frequência: ${r.frequencia} · `}{r.pessoas} pessoa(s){r.desejado_para ? ` · para ${fmtDate(r.desejado_para)}` : ''} · pedido {fmtDateTime(r.criado_em)}</div>
                    {r.proposta && <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>Proposta: {r.proposta} ({r.prazo_dias || '—'} dia(s), {r.custo_centavos ? brl(r.custo_centavos) : 'sem custo'})</p>}
                    <Row gap={1}>
                        <Button size="sm" onClick={() => onOpenTicket(r.chamado_id)}>Abrir conversa</Button>
                        {(STAFF_STAGE_NEXT[r.etapa] || []).map((next) => (
                            <Button key={next} size="sm" variant={next === 'recusado' ? 'ghost' : 'default'}
                                onClick={() => setEditing({ r, next, proposta: r.proposta || '', prazo_dias: r.prazo_dias || '', custo: '', motivo: '' })}>
                                → {STAGES[next].label}</Button>
                        ))}
                    </Row>
                </Stack>
            ))}
            {editing && <MoveModal editing={editing} setEditing={setEditing} onDone={() => { setEditing(null); reload(); }} />}
        </div>
    );
}

function MoveModal({ editing, setEditing, onDone }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const { r, next } = editing;
    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        const body = { etapa: next };
        if (next === 'proposta') {
            body.proposta = editing.proposta;
            body.prazo_dias = editing.prazo_dias;
            body.custo_centavos = editing.custo ? Math.round(Number(String(editing.custo).replace(/\./g, '').replace(',', '.')) * 100) : '';
        }
        if (next === 'recusado') body.motivo = editing.motivo;
        try { await customizationApi.staffUpdate(r.id, body); toast.success('Pedido atualizado.'); onDone(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
    };
    return (
        <FormModal title={`${r.escritorio}: ${STAGES[next].label}`} onClose={() => setEditing(null)} onSubmit={save} busy={busy} error={error}
            submitLabel="Confirmar" submitVariant={next === 'recusado' ? 'danger' : 'primary'}>
            {next === 'proposta' && (<>
                <Field label="O que será feito" hint="O escritório lê e aprova.">
                    <Textarea value={editing.proposta} onChange={(e) => setEditing({ ...editing, proposta: e.target.value })} />
                </Field>
                <FilterBar>
                    <Field label="Prazo (dias)"><Input type="number" min={1} value={editing.prazo_dias} onChange={(e) => setEditing({ ...editing, prazo_dias: e.target.value })} /></Field>
                    <Field label="Custo (R$)" hint="Vazio = sem custo"><MoneyInput value={editing.custo} onChange={(custo) => setEditing({ ...editing, custo })} /></Field>
                </FilterBar>
            </>)}
            {next === 'recusado' && (
                <Field label="Motivo" hint="Vai para o escritório.">
                    <Textarea value={editing.motivo} onChange={(e) => setEditing({ ...editing, motivo: e.target.value })} />
                </Field>
            )}
            {['em_analise', 'em_execucao', 'entregue'].includes(next) && <p className={`${styles.muted} ${styles.mt_0}`}>Confirmar a mudança de etapa?</p>}
        </FormModal>
    );
}
