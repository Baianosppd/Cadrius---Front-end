import styles from '../ui/ui.module.css';
import { Banner, Pill, Stack } from '../ui';
import { off } from './util';

const TONE = { pass: ['green', 'OK'], partial: ['yellow', 'Parcial'], fail: ['red', 'Falha'], na: ['gray', 'N/A'] };

export default function Configuracao({ c }) {
    if (off(c)) return <Banner tone="error">Configuração indisponível.</Banner>;
    return (
        <div className={styles.two_col}>
            <div className={styles.card}>
                <div className={styles.card_title}>Proteções do servidor web</div>
                {c.cabecalhos.map((h) => (
                    <div key={h.item} className={styles.list_row}>
                        <Pill tone={h.ok ? 'green' : 'red'}>{h.ok ? 'Ativo' : 'Inativo'}</Pill><span className={styles.flex_1}>{h.item}</span>
                    </div>
                ))}
            </div>
            <div className={styles.card}>
                <div className={styles.card_title}>Verificações automáticas ({c.falhas.length} com falha)</div>
                <Stack gap={0}>
                    {c.verificacoes.map((v) => (
                        <div key={v.nome} className={styles.list_row}>
                            <Pill tone={TONE[v.status]?.[0] || 'gray'}>{TONE[v.status]?.[1] || v.status}</Pill>
                            <span className={styles.flex_1}><strong>{v.titulo}</strong><br /><span className={styles.muted}>{v.detalhe}</span></span>
                        </div>
                    ))}
                </Stack>
            </div>
        </div>
    );
}
