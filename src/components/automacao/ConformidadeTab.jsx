import { Link } from 'react-router-dom';
import styles from '../seguranca/seguranca.module.css';
import { Banner, Empty, Loading, Pill, ScoreBar, StatCard } from '../seguranca/ui';
import useLoader from '../../pages/gestao/useLoader';
import { complianceApi } from '../../services/cad223';

const TONE = { alto: 'red', medio: 'yellow', baixo: 'gray' };

// Conformidade das automações e dos acessos (CAD-223): só aponta e explica o que fazer; não muda nada sozinho.
export default function ConformidadeTab() {
    const { data, error } = useLoader(() => complianceApi.get(), []);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    return (
        <div className={styles.stack}>
            <div className={styles.grid}>
                <div className={styles.card}>
                    <div className={styles.card_title}>Nota de conformidade</div>
                    <div className={styles.card_value}>{data.nota}</div>
                    <ScoreBar value={data.nota} />
                </div>
                <StatCard title="Regras com achados" value={data.regras.length} tone={data.regras.length ? 'red' : 'green'} />
                <StatCard title="Envios bloqueados (30 dias)" value={data.envios_bloqueados_30d} note="Falta de consentimento ou opt-out" />
                <StatCard title="Pessoas sem grupo de acesso" value={data.acessos.membros_sem_grupo} note="Seguem as regras do cargo" />
            </div>
            {data.dica_bloqueios && <Banner tone="warn">{data.dica_bloqueios}</Banner>}
            {data.regras.length === 0 ? <Empty title="Nenhum achado">As regras do escritório seguem as boas práticas abaixo.</Empty> : data.regras.map((r) => (
                <div key={r.id} className={styles.card}>
                    <div className={styles.btn_row} style={{ justifyContent: 'space-between' }}>
                        <strong>{r.nome}</strong><Pill tone={r.ligada ? 'green' : 'gray'}>{r.ligada ? 'Ligada' : 'Desligada'}</Pill>
                    </div>
                    {r.achados.map((a, i) => (
                        <div key={i} className={styles.list_row} style={{ alignItems: 'flex-start' }}>
                            <Pill tone={TONE[a.nivel]}>{a.nivel}</Pill>
                            <div style={{ flex: 1 }}><strong>{a.regra}</strong><div className={styles.muted}>{a.o_que_fazer}</div></div>
                        </div>
                    ))}
                </div>
            ))}
            <div className={styles.card_grid}>
                <div className={styles.card}>
                    <div className={styles.card_title}>Acessos</div>
                    <p className={styles.muted}>Grupos com financeiro: {data.acessos.grupos_com_financeiro.join(', ') || 'nenhum'}.</p>
                    <p className={styles.muted}>Permissões extras: {data.acessos.permissoes_extras.join('; ') || 'nenhuma'}.</p>
                    <Link to="/equipe" className={`${styles.btn} ${styles.btn_sm}`}>Revisar grupos de acesso</Link>
                </div>
                <div className={styles.card}>
                    <div className={styles.card_title}>Boas práticas</div>
                    <ul>{data.boas_praticas.map((b) => <li key={b} className={styles.muted}>{b}</li>)}</ul>
                </div>
            </div>
        </div>
    );
}
