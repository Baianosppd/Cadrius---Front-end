import { toast } from 'react-toastify';
import styles from '../ui/ui.module.css';
import { Banner, Empty, Pill, Select, Table } from '../ui';
import { errorMessage, fmtDateTime } from '../../utils/format';
import { backofficeApi } from '../../services/backoffice';
import { off } from './util';

const SEV = { critical: ['red', 'Crítica'], high: ['orange', 'Alta'], medium: ['yellow', 'Média'], low: ['gray', 'Baixa'] };
const ALERT = { open: 'Aberto', ack: 'Em análise', resolved: 'Resolvido', false_positive: 'Falso positivo' };

export default function Alertas({ data, reload }) {
    const al = data.alertas;
    if (off(al)) return <Banner tone="error">Alertas indisponíveis.</Banner>;
    const review = async (id, status) => {
        try {
            await backofficeApi.reviewAlert(id, status);
            toast.success('Alerta atualizado.');
            reload();
        } catch (e) {
            toast.error(errorMessage(e));
        }
    };
    if (al.recentes.length === 0) return <Empty title="Nenhum alerta">Os detectores de anomalia rodam a cada poucos minutos (força bruta, leitura em massa, exportação, escalada de privilégio…).</Empty>;
    return (
        <Table columns={['Quando', 'Gravidade', 'Regra', 'Resumo', 'IP', 'Situação']}>
            {al.recentes.map((a) => (
                <tr key={a.id}>
                    <td>{fmtDateTime(a.quando)}</td>
                    <td data-label="Gravidade"><Pill tone={SEV[a.gravidade]?.[0]}>{SEV[a.gravidade]?.[1] || a.gravidade}</Pill></td>
                    <td data-label="Regra" className={styles.mono}>{a.regra}</td>
                    <td data-label="Resumo">{a.resumo}</td>
                    <td data-label="IP" className={styles.mono}>{a.ip || '—'}</td>
                    <td data-label="Situação">
                        <Select value={a.status} aria-label={`Situação do alerta ${a.id}`} onChange={(e) => review(a.id, e.target.value)}>
                            {Object.entries(ALERT).map(([k, v]) => <option key={k} value={k} disabled={k === 'open'}>{v}</option>)}
                        </Select>
                    </td>
                </tr>
            ))}
        </Table>
    );
}
