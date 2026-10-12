import styles from '../ui/ui.module.css';
import { Banner, Button, Empty, Pill, Row, Table } from '../ui';
import { fmtDate } from '../../utils/format';
import useLoader from '../../hooks/useLoader';
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
                <div key={s.id} className={`${styles.list_row} ${styles.align_start}`}>
                    <Pill tone={s.tipo === 'indisponibilidade' ? 'yellow' : 'blue'}>{s.tribunal}</Pill>
                    <div className={styles.flex_1}>
                        <strong>{s.tipo_label}: {fmtDate(s.inicio)}{s.fim !== s.inicio ? ` a ${fmtDate(s.fim)}` : ''}</strong>
                        <div className={styles.muted}>{s.motivo}{s.comarca ? ` · comarca ${s.comarca}` : ''}</div>
                    </div>
                    {s.fonte && <Button as="a" size="sm" href={s.fonte} target="_blank" rel="noreferrer noopener">Ato oficial</Button>}
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
            <Table flat columns={['Tribunal', 'Horário', 'Links oficiais']}>
                {data.map((c) => (
                    <tr key={c.tribunal}>
                        <td><strong>{c.sigla}</strong><div className={styles.muted}>{c.nome}</div></td>
                        <td data-label="Horário">{c.horario || '—'}</td>
                        <td data-label="Links">
                            <Row gap={1}>
                                {c.balcao_virtual && <Button as="a" size="sm" href={c.balcao_virtual} target="_blank" rel="noreferrer noopener">Balcão Virtual</Button>}
                                {c.servicos && <Button as="a" size="sm" href={c.servicos} target="_blank" rel="noreferrer noopener">Serviços / custas</Button>}
                                {c.pauta && <Button as="a" size="sm" href={c.pauta} target="_blank" rel="noreferrer noopener">Pauta</Button>}
                            </Row>
                            {c.observacoes && <div className={styles.muted}>{c.observacoes}</div>}
                        </td>
                    </tr>
                ))}
            </Table>
        </div>
    );
}
