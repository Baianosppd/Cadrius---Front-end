import { toast } from 'react-toastify';
import styles from '../ui/ui.module.css';
import { Banner, Button, Empty, Loading, Pill, Row, Stack } from '../ui';
import { errorMessage, fmtDateTime } from '../../utils/format';
import useLoader from '../../hooks/useLoader';
import { RUN_STATUS, STEP_STATUS, rulesApi } from '../../services/rules';

// pendentes=true: fila de aprovação (o que vai sair para clientes/ERP); false: histórico das execuções
export default function ExecucoesTab({ pendentes, canApprove, onChange }) {
    const { data, error, reload } = useLoader(() => rulesApi.runs(pendentes ? { status: 'pending_approval' } : {}), [pendentes]);
    const decide = async (run, ok) => {
        try {
            if (ok) await rulesApi.approve(run.id);
            else {
                const motivo = window.prompt('Motivo da recusa (opcional):', '');
                if (motivo === null) return;
                await rulesApi.reject(run.id, motivo);
            }
            toast.success(ok ? 'Aprovado: envio realizado.' : 'Recusado: nada foi enviado.');
            reload();
            onChange?.();
        } catch (err) {
            toast.error(errorMessage(err));
            reload();
        }
    };
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    if (data.length === 0) return <Empty>{pendentes ? 'Nada aguardando aprovação.' : 'Nenhuma execução ainda.'}</Empty>;
    return (
        <Stack gap={2}>
            {pendentes && <Banner tone="info">Aprovações expiram em 7 dias.</Banner>}
            {data.map((run) => {
                const [label, tone] = RUN_STATUS[run.status] || [run.status, 'gray'];
                return (
                    <Stack key={run.id} gap={2} className={styles.card}>
                        <div className={styles.header_row}>
                            <div>
                                <strong>{run.regra.nome}</strong> <Pill tone={tone}>{label}</Pill>
                                {run.codigo_relogio && <span className={styles.muted} title="Diga ao relógio: aprovar e este código"> · código no relógio <strong>{run.codigo_relogio}</strong></span>}
                                <div className={styles.muted}>{run.titulo} · {fmtDateTime(run.criada_em)}
                                    {run.decidido_por && ` · decidido por ${run.decidido_por}`}{run.observacao && ` (${run.observacao})`}</div>
                            </div>
                            {pendentes && canApprove && (
                                <Row>
                                    <Button variant="primary" onClick={() => decide(run, true)}>Aprovar e enviar</Button>
                                    <Button onClick={() => decide(run, false)}>Recusar</Button>
                                </Row>
                            )}
                        </div>
                        {run.passos.map((p, i) => {
                            const [sl, st] = STEP_STATUS[p.status] || [p.status, 'gray'];
                            return (
                                <div key={i}>
                                    <Pill tone={st}>{sl}</Pill> <strong>{p.rotulo}</strong> <span className={styles.muted}>{p.detalhe}</span>
                                    {p.status === 'aguardando' && p.dados?.mensagem && (
                                        <div className={`${styles.doc_text} ${styles.pre_wrap} ${styles.mt_2}`}>
                                            {p.dados.assunto && <div><strong>Assunto:</strong> {p.dados.assunto}</div>}{p.dados.mensagem}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </Stack>
                );
            })}
        </Stack>
    );
}
