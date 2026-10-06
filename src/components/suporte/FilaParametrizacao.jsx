import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../seguranca/seguranca.module.css';
import { Banner, Empty, StatusPill, errorMessage, fmtDate, fmtDateTime } from '../seguranca/ui';
import useLoader from '../../pages/gestao/useLoader';
import { STAFF_STAGE_NEXT, STAGES, brl, customizationApi } from '../../services/cad223';

// Gestão Cadrius → Suporte: fila de pedidos de parametrização (CAD-223)
export default function FilaParametrizacao({ onOpenTicket }) {
    const [etapa, setEtapa] = useState('');
    const { data, error, reload } = useLoader(() => customizationApi.staffList(etapa), [etapa]);
    const [editing, setEditing] = useState(null);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Empty>Carregando…</Empty>;
    return (
        <div className={styles.stack}>
            <div className={styles.btn_row}>
                <button type="button" className={`${styles.chip} ${!etapa ? styles.chip_active : ''}`} onClick={() => setEtapa('')}>Todos</button>
                {Object.entries(STAGES).map(([k, v]) => (
                    <button key={k} type="button" className={`${styles.chip} ${etapa === k ? styles.chip_active : ''}`} onClick={() => setEtapa(k)}>
                        {v.label} <span className={styles.count}>{data.por_etapa[k] || 0}</span></button>
                ))}
            </div>
            {data.resultados.length === 0 && <Empty>Nenhum pedido.</Empty>}
            {data.resultados.map((r) => (
                <div key={r.id} className={styles.card}>
                    <div className={styles.btn_row} style={{ justifyContent: 'space-between' }}>
                        <strong>{r.escritorio} · {r.area_label}</strong><StatusPill map={STAGES} value={r.etapa} />
                    </div>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{r.objetivo}</p>
                    {r.exemplo && <p className={styles.muted} style={{ whiteSpace: 'pre-wrap' }}>Exemplo: {r.exemplo}</p>}
                    <div className={styles.muted}>{r.frequencia && `Frequência: ${r.frequencia} · `}{r.pessoas} pessoa(s){r.desejado_para ? ` · para ${fmtDate(r.desejado_para)}` : ''} · pedido {fmtDateTime(r.criado_em)}</div>
                    {r.proposta && <p className={styles.muted}>Proposta: {r.proposta} ({r.prazo_dias || '—'} dia(s), {r.custo_centavos ? brl(r.custo_centavos) : 'sem custo'})</p>}
                    <div className={styles.btn_row} style={{ marginTop: 8 }}>
                        <button type="button" className={`${styles.btn} ${styles.btn_sm}`} onClick={() => onOpenTicket(r.chamado_id)}>Abrir conversa</button>
                        {(STAFF_STAGE_NEXT[r.etapa] || []).map((next) => (
                            <button key={next} type="button" className={`${styles.btn} ${styles.btn_sm} ${next === 'recusado' ? styles.btn_ghost : ''}`}
                                onClick={() => setEditing({ r, next, proposta: r.proposta || '', prazo_dias: r.prazo_dias || '', custo: '', motivo: '' })}>
                                → {STAGES[next].label}</button>
                        ))}
                    </div>
                </div>
            ))}
            {editing && <MoveModal editing={editing} setEditing={setEditing} onDone={() => { setEditing(null); reload(); }} />}
        </div>
    );
}

function MoveModal({ editing, setEditing, onDone }) {
    const [busy, setBusy] = useState(false);
    const { r, next } = editing;
    const save = async () => {
        setBusy(true);
        const body = { etapa: next };
        if (next === 'proposta') {
            body.proposta = editing.proposta;
            body.prazo_dias = editing.prazo_dias;
            body.custo_centavos = editing.custo ? Math.round(Number(String(editing.custo).replace(/\./g, '').replace(',', '.')) * 100) : '';
        }
        if (next === 'recusado') body.motivo = editing.motivo;
        try { await customizationApi.staffUpdate(r.id, body); toast.success('Pedido atualizado.'); onDone(); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
    };
    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Atualizar pedido">
            <div className={styles.modal} style={{ maxWidth: 600 }}>
                <div className={styles.modal_title}>{r.escritorio}: {STAGES[next].label}</div>
                {next === 'proposta' && (<>
                    <label className={styles.field}>O que será feito (o escritório lê e aprova)<textarea className={styles.textarea} value={editing.proposta} onChange={(e) => setEditing({ ...editing, proposta: e.target.value })} /></label>
                    <div className={styles.filters}>
                        <label className={styles.field}>Prazo (dias)<input className={styles.input} type="number" min={1} value={editing.prazo_dias} onChange={(e) => setEditing({ ...editing, prazo_dias: e.target.value })} /></label>
                        <label className={styles.field}>Custo (R$, vazio = sem custo)<input className={styles.input} inputMode="decimal" value={editing.custo} onChange={(e) => setEditing({ ...editing, custo: e.target.value })} /></label>
                    </div>
                </>)}
                {next === 'recusado' && <label className={styles.field}>Motivo (vai para o escritório)<textarea className={styles.textarea} value={editing.motivo} onChange={(e) => setEditing({ ...editing, motivo: e.target.value })} /></label>}
                {['em_analise', 'em_execucao', 'entregue'].includes(next) && <p className={styles.muted}>Confirmar a mudança de etapa?</p>}
                <div className={styles.btn_row} style={{ justifyContent: 'flex-end' }}>
                    <button type="button" className={styles.btn} onClick={() => setEditing(null)}>Cancelar</button>
                    <button type="button" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy} onClick={save}>Confirmar</button>
                </div>
            </div>
        </div>
    );
}
