import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiArrowDown, FiArrowUp, FiX } from 'react-icons/fi';
import styles from '../../components/seguranca/seguranca.module.css';
import { Banner, Empty, PageHeader, Pill, errorMessage, fmtDateTime } from '../../components/seguranca/ui';
import useLoader from './useLoader';
import api from '../../services/api';

const iaApi = {
    get: () => api.get('backoffice/ia/rotas/').then((r) => r.data),
    save: (act, body) => api.patch(`backoffice/ia/rotas/${act}/`, body).then((r) => r.data),
    reset: (act) => api.delete(`backoffice/ia/rotas/${act}/`).then((r) => r.data),
};

// Gestão → IA por atividade (CAD-224): qual IA atende cada tipo de trabalho, com reservas automáticas
export default function IaAtividades() {
    const { data, error, reload } = useLoader(iaApi.get, []);
    const [editing, setEditing] = useState(null);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Empty>Carregando…</Empty>;
    const name = Object.fromEntries(data.provedores.map((p) => [p.chave, p.nome]));
    const save = async (act, cadeia, usar_reservas) => {
        try { await iaApi.save(act, { cadeia, usar_reservas }); toast.success('Cadeia salva.'); setEditing(null); reload(); }
        catch (e) { toast.error(errorMessage(e)); }
    };
    const reset = async (act) => {
        try { await iaApi.reset(act); toast.success('Voltou à recomendação.'); setEditing(null); reload(); } catch (e) { toast.error(errorMessage(e)); }
    };
    return (
        <div className={styles.page}>
            <PageHeader title="IA por atividade" subtitle="A melhor IA para cada trabalho" />
            <Banner tone="info"><ul style={{ margin: 0, paddingLeft: 18 }}>{data.regras.map((r) => <li key={r}>{r}</li>)}</ul></Banner>
            <div className={styles.card_grid}>
                {data.atividades.map((a) => (
                    <div key={a.atividade} className={styles.card}>
                        <div className={styles.btn_row} style={{ justifyContent: 'space-between' }}>
                            <strong>{a.rotulo}</strong>
                            {a.personalizado ? <Pill tone="yellow">personalizada</Pill> : <Pill tone="green">recomendada</Pill>}
                        </div>
                        <p className={styles.muted}>{a.onde}</p>
                        <p className={styles.muted}><em>{a.por_que}</em></p>
                        <div className={styles.list_row}><span>Atende agora</span>
                            <strong>{a.atende_agora ? name[a.atende_agora] : <span style={{ color: 'var(--c-danger)' }}>nenhuma IA configurada</span>}</strong></div>
                        <ol className={styles.muted} style={{ paddingLeft: 18, margin: '8px 0' }}>
                            {a.cadeia.map((p) => <li key={p}>{name[p] || p}{a.ordem_efetiva.includes(p) ? '' : ' — sem chave/indisponível'}</li>)}
                        </ol>
                        <div className={styles.muted}>{a.usar_reservas ? 'Depois da cadeia: demais IAs configuradas como reserva.' : 'Só a cadeia acima (sem reservas).'}</div>
                        <div className={styles.btn_row} style={{ marginTop: 8 }}>
                            <button type="button" className={`${styles.btn} ${styles.btn_sm}`} onClick={() => setEditing(a)}>Alterar ordem</button>
                            {a.personalizado && <button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_ghost}`} onClick={() => reset(a.atividade)}>Usar a recomendada</button>}
                        </div>
                    </div>
                ))}
            </div>
            <div className={styles.table_wrap}>
                <table className={styles.table}>
                    <thead><tr><th>Provedor</th><th>Chave</th><th>Modelo</th><th>Saúde</th><th>Observação</th></tr></thead>
                    <tbody>{data.provedores.map((p) => (
                        <tr key={p.chave}>
                            <td><strong>{p.nome}</strong></td>
                            <td>{p.configurado ? <Pill tone="green">configurado</Pill> : <Pill tone="gray">sem chave</Pill>}</td>
                            <td>{p.modelo}</td>
                            <td>{p.saude.fora_do_ar ? <Pill tone="red">fora (reserva assume)</Pill> : p.saude.falhas ? <Pill tone="yellow">{p.saude.falhas} falha(s)</Pill> : <Pill tone="green">ok</Pill>}
                                {p.saude.ultimo_sucesso && <div className={styles.muted}>último ok {fmtDateTime(p.saude.ultimo_sucesso)}</div>}</td>
                            <td className={styles.muted}>{p.treina_com_dados ? 'Plano gratuito treina com os dados: nunca recebe dado de cliente.' : p.local ? 'Roda no servidor.' : ''}</td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
            {editing && <Editor a={editing} providers={data.provedores} onClose={() => setEditing(null)} onSave={save} />}
        </div>
    );
}

function Editor({ a, providers, onClose, onSave }) {
    const [chain, setChain] = useState(a.cadeia);
    const [reserves, setReserves] = useState(a.usar_reservas);
    const move = (i, d) => { const c = [...chain]; [c[i], c[i + d]] = [c[i + d], c[i]]; setChain(c); };
    const name = Object.fromEntries(providers.map((p) => [p.chave, p.nome]));
    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="ia-edit">
            <div className={styles.modal} style={{ maxWidth: 560 }}>
                <div id="ia-edit" className={styles.modal_title}>{a.rotulo}</div>
                <p className={styles.muted}>A 1ª da lista atende; se falhar, a próxima assume. Recomendado: {a.recomendado.map((p) => name[p] || p).join(' > ')}.</p>
                {chain.map((p, i) => (
                    <div key={p} className={styles.list_row}>
                        <span>{i + 1}. {name[p] || p}</span>
                        <span className={styles.btn_row}>
                            <button type="button" className={`${styles.btn} ${styles.btn_sm}`} disabled={i === 0} aria-label={`Subir ${name[p]}`} onClick={() => move(i, -1)}><FiArrowUp aria-hidden="true" /></button>
                            <button type="button" className={`${styles.btn} ${styles.btn_sm}`} disabled={i === chain.length - 1} aria-label={`Descer ${name[p]}`} onClick={() => move(i, 1)}><FiArrowDown aria-hidden="true" /></button>
                            <button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_ghost}`} disabled={chain.length === 1} aria-label={`Tirar ${name[p]}`} onClick={() => setChain(chain.filter((x) => x !== p))}><FiX aria-hidden="true" /></button>
                        </span>
                    </div>
                ))}
                <label className={styles.field}>Adicionar à cadeia
                    <select className={styles.select} value="" onChange={(e) => e.target.value && setChain([...chain, e.target.value])}>
                        <option value="">Escolha…</option>
                        {providers.filter((p) => !chain.includes(p.chave)).map((p) => <option key={p.chave} value={p.chave}>{p.nome}{p.configurado ? '' : ' (sem chave)'}</option>)}
                    </select>
                </label>
                <label className={styles.check_row}><input type="checkbox" checked={reserves} onChange={(e) => setReserves(e.target.checked)} /> Se toda a cadeia falhar, usar as demais IAs configuradas como reserva</label>
                <div className={styles.btn_row} style={{ justifyContent: 'flex-end' }}>
                    <button type="button" className={styles.btn} onClick={onClose}>Cancelar</button>
                    <button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={() => onSave(a.atividade, chain, reserves)}>Salvar</button>
                </div>
            </div>
        </div>
    );
}
