import styles from '../ui/ui.module.css';
import m from './Marketing.module.css';
import { Banner, Empty, Loading, Pill, Stack, StatCard } from '../ui';
import useLoader from '../../hooks/useLoader';

// Indicadores de aquisição (só na Gestão Cadrius): cadastros, conversão e playbook
export default function Indicadores({ api }) {
    const { data, error } = useLoader(() => api.growth(), []);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    const max = Math.max(1, ...data.por_semana.map((w) => w.cadastros));
    return (
        <Stack>
            <div className={styles.grid}>
                <StatCard title={`Cadastros (${data.periodo_dias} dias)`} value={data.cadastros} />
                <StatCard title="Em teste" value={data.em_teste} />
                <StatCard title="Pagantes" value={data.pagantes} note={data.conversao_pct !== null ? `${data.conversao_pct}% de conversão` : ''} />
                <StatCard title="Conteúdos publicados" value={data.conteudos_publicados} />
            </div>
            <div className={styles.card}>
                <div className={styles.section_title}>Cadastros por semana</div>
                {data.por_semana.length === 0 ? <Empty>Sem cadastros no período.</Empty> : data.por_semana.map((w) => (
                    <div key={w.semana} className={m.bar_row}>
                        <span className={m.bar_label}>{w.semana.slice(8, 10)}/{w.semana.slice(5, 7)}</span>
                        {/* A largura da barra depende do dado: fica inline */}
                        <div className={`${styles.bar} ${styles.flex_1}`}><div className={styles.bar_fill} style={{ width: `${(100 * w.cadastros) / max}%` }} /></div>
                        <span className={m.bar_value}>{w.cadastros} ({w.pagantes} pag.)</span>
                    </div>
                ))}
            </div>
            <div className={styles.card}>
                <div className={styles.section_title}>Playbook de aquisição</div>
                {data.playbook.map((p) => (
                    <div key={p.acao} className={`${styles.kv} ${m.kv_col}`}>
                        <strong>{p.acao} <Pill tone="blue">{p.canal}</Pill></strong><span className={styles.muted}>{p.por_que}</span>
                    </div>
                ))}
            </div>
        </Stack>
    );
}
