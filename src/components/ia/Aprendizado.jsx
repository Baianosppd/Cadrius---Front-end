import { useState } from 'react';
import styles from '../seguranca/seguranca.module.css';
import { Banner, Empty, StatCard } from '../seguranca/ui';
import useLoader from '../../pages/gestao/useLoader';
import { LEARNING_KIND, MEMORY_KIND, brainApi, formatMinutes } from '../../services/brain';

// Painel de aprendizado (CAD-174): quanto a IA acerta por tipo de tarefa e o que ela já guardou do escritório
export default function Aprendizado() {
    const [dias, setDias] = useState(90);
    const { data, error } = useLoader(() => brainApi.insights(dias), [dias]);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Empty>Carregando…</Empty>;
    const kinds = Object.entries(data.por_tipo || {});
    return (
        <div className={styles.stack}>
            <div className={styles.btn_row} role="group" aria-label="Período">
                {[30, 90, 365].map((d) => (
                    <button key={d} type="button" className={`${styles.chip} ${dias === d ? styles.chip_active : ''}`} aria-pressed={dias === d} onClick={() => setDias(d)}>
                        {d === 365 ? '12 meses' : `${d} dias`}
                    </button>
                ))}
            </div>
            <div className={styles.grid}>
                <StatCard title="Tempo economizado (estimado)" value={formatMinutes(data.tempo_economizado_min)} note={data.nota} />
                <StatCard title="Regras aprendidas" value={data.regras_aprendidas} note={`${data.regras_propostas} aguardando sua decisão`} />
                <StatCard title="Sugestões de automação" value={data.sugestoes.aceitas} note={`aceitas · ${data.sugestoes.abertas} abertas · ${data.sugestoes.dispensadas} dispensadas`} />
                <StatCard title="Itens na memória" value={Object.values(data.memoria || {}).reduce((a, b) => a + b, 0)} note="exemplos aprovados que guiam a IA" />
            </div>
            <div className={styles.card}>
                <div className={styles.section_title}>Acerto da IA por tipo de tarefa</div>
                {kinds.length === 0 ? <Empty>Ainda sem decisões no período. Cada aprovação, correção ou recusa ensina a IA.</Empty> : (
                    <div className={styles.table_wrap} style={{ border: 'none' }}>
                        <table className={styles.table}>
                            <thead><tr><th>Tarefa</th><th>Decisões</th><th>Aceitas</th><th>Sem edição</th><th>Recusadas/desfeitas</th></tr></thead>
                            <tbody>
                                {kinds.map(([k, v]) => (
                                    <tr key={k}>
                                        <td>{LEARNING_KIND[k] || k}</td>
                                        <td>{v.total}</td>
                                        <td><Bar value={v.taxa_aceite} /></td>
                                        <td><Bar value={v.taxa_sem_edicao} /></td>
                                        <td>{v.rejected + v.undone}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <div className={styles.card}>
                <div className={styles.section_title}>O que está na memória do escritório</div>
                {Object.keys(data.memoria || {}).length === 0 ? <Empty>Vazia por enquanto.</Empty>
                    : Object.entries(data.memoria).map(([k, n]) => <div key={k} className={styles.kv}><span>{MEMORY_KIND[k] || k}</span><strong>{n}</strong></div>)}
            </div>
        </div>
    );
}

function Bar({ value }) {
    if (value === null || value === undefined) return '—';
    const tone = value >= 85 ? styles.bar_fill_green : value >= 60 ? '' : styles.bar_fill_yellow;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
            <div className={styles.bar} style={{ flex: 1 }}><div className={`${styles.bar_fill} ${tone}`} style={{ width: `${value}%` }} /></div>
            <span style={{ fontSize: '.8rem', minWidth: 34 }}>{value}%</span>
        </div>
    );
}
