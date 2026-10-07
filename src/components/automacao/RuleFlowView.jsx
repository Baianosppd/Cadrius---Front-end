import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiFilter, FiPlay, FiPower, FiZap, FiCheckSquare, FiX } from 'react-icons/fi';
import ui from '../seguranca/seguranca.module.css';
import { Banner, Pill, errorMessage } from '../seguranca/ui';
import { rulesApi } from '../../services/rules';
import s from './RuleFlowView.module.css';
import ShortcutPanel from './ShortcutPanel';

const RUN_TONE = { success: 'green', partial: 'yellow', failed: 'red', skipped: 'gray', pending_approval: 'yellow', rejected: 'gray', expired: 'gray', scheduled: 'blue', running: 'blue' };
const fmt = (d) => (d ? new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—');

function describeParams(params = {}) {
    const keys = ['titulo', 'assunto', 'mensagem', 'canal', 'para', 'prioridade'];
    return keys.filter((k) => params[k]).map((k) => `${k}: ${String(params[k]).slice(0, 70)}`).join(' · ');
}

// Regra desenhada como fluxo, com as execuções atualizando sozinhas (CAD-226).
export default function RuleFlowView({ ruleId, catalog, canManage, onClose, onEdit }) {
    const [rule, setRule] = useState(null);
    const [runs, setRuns] = useState([]);
    const [selected, setSelected] = useState(null);
    const [sim, setSim] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let stop = false;
        const load = async () => {
            try {
                const [r, rs] = await Promise.all([rulesApi.get(ruleId), rulesApi.runs({ regra: ruleId })]);
                if (stop) return;
                setRule(r); setRuns(rs); setError('');
            } catch (err) { if (!stop) setError(errorMessage(err)); }
        };
        load();
        const id = setInterval(load, 5000);           // "ao vivo": novas execuções aparecem sem recarregar
        return () => { stop = true; clearInterval(id); };
    }, [ruleId]);

    const labelTrigger = catalog?.gatilhos?.find((g) => g.id === rule?.gatilho)?.label || rule?.gatilho_label;
    const labelAction = (t) => catalog?.acoes?.find((a) => a.id === t)?.label || t;
    const labelOp = (o) => catalog?.operadores?.find((x) => x.id === o)?.label || o;
    const run = selected ? runs.find((r) => r.id === selected) : runs[0];
    const stepStatus = (i) => (sim ? sim.passos?.[i]?.status : run?.passos?.[i]?.status);

    const simulate = async () => {
        try { setSim(await rulesApi.simulate(ruleId)); toast.info('Simulação feita com o evento mais recente: nada foi enviado.'); }
        catch (err) { toast.error(errorMessage(err)); }
    };
    const toggle = async () => {
        try { const r = await rulesApi.enable(ruleId, !rule.ativa); setRule(r.regra || r); toast.success(r.ativa ? 'Regra ligada: o fluxo já está rodando.' : 'Regra desligada.'); }
        catch (err) { toast.error(errorMessage(err)); }
    };

    if (error && !rule) return <Banner tone="error">{error}</Banner>;
    if (!rule) return <p className={ui.muted}>Carregando o fluxo…</p>;
    const live = rule.ativa;
    return (
        <section className={ui.card} aria-labelledby="flow-title">
            <div className={ui.btn_row} style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                    <div id="flow-title" className={ui.section_title}>{rule.nome}</div>
                    {rule.descricao && <p className={ui.muted}>{rule.descricao}</p>}
                    <span className={s.live}><span className={`${s.dot} ${live ? '' : s.dot_off}`} aria-hidden="true" />
                        {live ? 'Ligada: rodando a cada evento (atualiza sozinho)' : 'Desligada: simule e ligue para começar a rodar'}</span>
                </div>
                <div className={ui.btn_row}>
                    {canManage && <button type="button" className={ui.btn} onClick={simulate}><FiPlay aria-hidden="true" /> Simular</button>}
                    {canManage && <button type="button" className={`${ui.btn} ${live ? '' : ui.btn_primary}`} onClick={toggle} disabled={!live && !rule.simulada && !sim}>
                        <FiPower aria-hidden="true" /> {live ? 'Desligar' : 'Ligar'}</button>}
                    {canManage && <button type="button" className={ui.btn} onClick={() => onEdit(rule)}>Editar</button>}
                    <button type="button" className={ui.btn} onClick={onClose} aria-label="Fechar o fluxo"><FiX aria-hidden="true" /></button>
                </div>
            </div>

            <div className={s.flow} role="list" aria-label="Etapas da regra" style={{ marginTop: 12 }}>
                <div className={`${s.node} ${s.trigger}`} role="listitem">
                    <span className={s.kind}><FiZap aria-hidden="true" /> Quando</span>
                    <span className={s.label}>{labelTrigger}</span>
                    {Object.keys(rule.gatilho_config || {}).length > 0 && <span className={s.detail}>{Object.entries(rule.gatilho_config).map(([k, v]) => `${k}: ${v}`).join(' · ')}</span>}
                </div>
                {(rule.condicoes || []).length > 0 && (
                    <>
                        <div className={`${s.arrow} ${live ? s.arrow_live : ''}`} aria-hidden="true" />
                        <div className={`${s.node} ${s.condition}`} role="listitem">
                            <span className={s.kind}><FiFilter aria-hidden="true" /> Se</span>
                            {rule.condicoes.map((c, i) => <span key={i} className={s.detail}>{c.field} {labelOp(c.op)} {Array.isArray(c.value) ? c.value.join(', ') : (c.value ?? '')}</span>)}
                            {sim && <Pill tone={sim.condicoes_atendidas ? 'green' : 'gray'}>{sim.condicoes_atendidas ? 'atendidas na simulação' : 'não atendidas na simulação'}</Pill>}
                        </div>
                    </>
                )}
                {(rule.acoes || []).map((a, i) => (
                    <div key={i} style={{ display: 'contents' }}>
                        <div className={`${s.arrow} ${live ? s.arrow_live : ''}`} aria-hidden="true" />
                        <div className={`${s.node} ${s.action} ${stepStatus(i) ? s[`st_${stepStatus(i)}`] || '' : ''}`} role="listitem">
                            <span className={s.kind}><FiCheckSquare aria-hidden="true" /> Faça {i + 1}</span>
                            <span className={s.label}>{labelAction(a.type)}</span>
                            <span className={s.detail}>{describeParams(a.params)}</span>
                            {stepStatus(i) && <Pill tone={stepStatus(i) === 'feito' ? 'green' : stepStatus(i) === 'falhou' ? 'red' : 'yellow'}>{stepStatus(i)}</Pill>}
                        </div>
                    </div>
                ))}
            </div>

            {rule.gatilho === 'shortcut' && <ShortcutPanel rule={rule} canManage={canManage} />}

            {sim && (
                <Banner tone="info">Simulação com {sim.origem === 'real' ? 'o evento real mais recente' : 'um evento de exemplo'}: <strong>{sim.evento}</strong>.
                    {' '}As cores mostram o que aconteceria. Nada foi enviado. <button type="button" className={ui.link_btn} onClick={() => setSim(null)}>Ver execuções reais</button></Banner>
            )}

            <div className={ui.section_title} style={{ marginTop: 16 }}>Execuções ({runs.length})</div>
            {runs.length === 0 ? (
                <p className={ui.muted}>{live ? 'Ainda não rodou: assim que o evento acontecer, a execução aparece aqui.' : 'Nenhuma execução ainda.'}</p>
            ) : (
                <div className={s.runs}>
                    {runs.slice(0, 15).map((r) => (
                        <button type="button" key={r.id} className={`${s.run} ${run?.id === r.id && !sim ? s.run_selected : ''}`} onClick={() => { setSim(null); setSelected(r.id); }}>
                            <span style={{ minWidth: 0 }}><strong>{r.titulo || 'Evento'}</strong><br /><small>{fmt(r.criada_em)}{r.decidido_por ? ` · decidido por ${r.decidido_por}` : ''}</small></span>
                            <Pill tone={RUN_TONE[r.status] || 'gray'}>{r.status_label}</Pill>
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}
