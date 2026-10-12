import { useState } from 'react';
import styles from '../ui/ui.module.css';
import s from './IA.module.css';
import { Banner, Chip, Empty, Loading, Row, Stack, StatCard, Table } from '../ui';
import useLoader from '../../hooks/useLoader';
import { LEARNING_KIND, MEMORY_KIND, brainApi, formatMinutes } from '../../services/brain';

// Painel de aprendizado (CAD-174): quanto a IA acerta por tipo de tarefa e o que ela já guardou do escritório
export default function Aprendizado() {
    const [dias, setDias] = useState(90);
    const { data, error } = useLoader(() => brainApi.insights(dias), [dias]);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    const kinds = Object.entries(data.por_tipo || {});
    return (
        <Stack>
            <Row role="group" aria-label="Período">
                {[30, 90, 365].map((d) => (
                    <Chip key={d} active={dias === d} onClick={() => setDias(d)}>{d === 365 ? '12 meses' : `${d} dias`}</Chip>
                ))}
            </Row>
            <div className={styles.grid}>
                <StatCard title="Tempo economizado (estimado)" value={formatMinutes(data.tempo_economizado_min)} note={data.nota} />
                <StatCard title="Regras aprendidas" value={data.regras_aprendidas} note={`${data.regras_propostas} aguardando sua decisão`} />
                <StatCard title="Sugestões de automação" value={data.sugestoes.aceitas} note={`aceitas · ${data.sugestoes.abertas} abertas · ${data.sugestoes.dispensadas} dispensadas`} />
                <StatCard title="Itens na memória" value={Object.values(data.memoria || {}).reduce((a, b) => a + b, 0)} note="exemplos aprovados que guiam a IA" />
            </div>
            <div className={styles.card}>
                <div className={styles.section_title}>Acerto da IA por tipo de tarefa</div>
                {kinds.length === 0 ? <Empty>Ainda sem decisões no período. Cada aprovação, correção ou recusa ensina a IA.</Empty> : (
                    <Table flat columns={['Tarefa', 'Decisões', 'Aceitas', 'Sem edição', 'Recusadas/desfeitas']}>
                        {kinds.map(([k, v]) => (
                            <tr key={k}>
                                <td>{LEARNING_KIND[k] || k}</td>
                                <td data-label="Decisões">{v.total}</td>
                                <td data-label="Aceitas"><Bar value={v.taxa_aceite} /></td>
                                <td data-label="Sem edição"><Bar value={v.taxa_sem_edicao} /></td>
                                <td data-label="Recusadas">{v.rejected + v.undone}</td>
                            </tr>
                        ))}
                    </Table>
                )}
            </div>
            <div className={styles.card}>
                <div className={styles.section_title}>O que está na memória do escritório</div>
                {Object.keys(data.memoria || {}).length === 0 ? <Empty>Vazia por enquanto.</Empty>
                    : Object.entries(data.memoria).map(([k, n]) => <div key={k} className={styles.kv}><span>{MEMORY_KIND[k] || k}</span><strong>{n}</strong></div>)}
            </div>
        </Stack>
    );
}

// Barra de porcentagem; a largura depende do dado, por isso fica inline
function Bar({ value }) {
    if (value === null || value === undefined) return '—';
    const tone = value >= 85 ? styles.bar_fill_green : value >= 60 ? '' : styles.bar_fill_yellow;
    return (
        <Row gap={2} wrap={false} className={s.bar_cell}>
            <div className={`${styles.bar} ${styles.flex_1}`}><div className={`${styles.bar_fill} ${tone}`} style={{ width: `${value}%` }} /></div>
            <span className={s.bar_pct}>{value}%</span>
        </Row>
    );
}
