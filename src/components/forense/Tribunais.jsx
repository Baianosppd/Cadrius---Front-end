import styles from '../seguranca/seguranca.module.css';
import { Banner, Empty, Pill, fmtDate } from '../seguranca/ui';
import useLoader from '../../pages/gestao/useLoader';
import { courtsApi } from '../../services/cad223';

// CAD-223: suspensões de prazo/indisponibilidades cadastradas pela Cadrius (já entram na contagem) e serviços dos tribunais.
export function SuspensoesTribunais() {
    const { data, error } = useLoader(() => courtsApi.suspensions(), []);
    return (
        <div className={styles.card}>
            <div className={styles.card_title}>Suspensões de prazo nos seus tribunais</div>
            <p className={styles.muted}>Mantidas pela equipe Cadrius a partir do ato oficial de cada tribunal. Já entram no cálculo de prazos acima e
                disparam o gatilho "Suspensão de prazos no tribunal".</p>
            {error && <Banner tone="error">{error}</Banner>}
            {data && data.length === 0 && <Empty>Nenhuma suspensão recente ou próxima nos tribunais dos seus processos.</Empty>}
            {data && data.map((s) => (
                <div key={s.id} className={styles.list_row} style={{ alignItems: 'flex-start' }}>
                    <Pill tone={s.tipo === 'indisponibilidade' ? 'yellow' : 'blue'}>{s.tribunal}</Pill>
                    <div style={{ flex: 1 }}>
                        <strong>{s.tipo_label}: {fmtDate(s.inicio)}{s.fim !== s.inicio ? ` a ${fmtDate(s.fim)}` : ''}</strong>
                        <div className={styles.muted}>{s.motivo}{s.comarca ? ` · comarca ${s.comarca}` : ''}</div>
                    </div>
                    {s.fonte && <a className={`${styles.btn} ${styles.btn_sm}`} href={s.fonte} target="_blank" rel="noreferrer noopener">Ato oficial</a>}
                </div>
            ))}
        </div>
    );
}

export function ServicosTribunais() {
    const { data, error } = useLoader(() => courtsApi.directory(), []);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data || data.length === 0) return null;
    return (
        <div className={styles.card}>
            <div className={styles.card_title}>Serviços dos tribunais</div>
            <p className={styles.muted}>Balcão Virtual (Res. CNJ 372/2021): fale com a secretaria por vídeo no horário de expediente, sem ir ao fórum.</p>
            <div className={styles.table_wrap}>
                <table className={styles.table}>
                    <thead><tr><th>Tribunal</th><th>Horário</th><th>Links oficiais</th></tr></thead>
                    <tbody>
                        {data.map((c) => (
                            <tr key={c.tribunal}>
                                <td><strong>{c.sigla}</strong><div className={styles.muted}>{c.nome}</div></td>
                                <td>{c.horario || '—'}</td>
                                <td><div className={styles.btn_row}>
                                    {c.balcao_virtual && <a className={`${styles.btn} ${styles.btn_sm}`} href={c.balcao_virtual} target="_blank" rel="noreferrer noopener">Balcão Virtual</a>}
                                    {c.servicos && <a className={`${styles.btn} ${styles.btn_sm}`} href={c.servicos} target="_blank" rel="noreferrer noopener">Serviços / custas</a>}
                                    {c.pauta && <a className={`${styles.btn} ${styles.btn_sm}`} href={c.pauta} target="_blank" rel="noreferrer noopener">Pauta</a>}
                                </div>{c.observacoes && <div className={styles.muted}>{c.observacoes}</div>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
