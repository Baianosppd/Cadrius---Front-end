import styles from '../ui/ui.module.css';
import { Banner, Stack, Table } from '../ui';
import { fmtDateTime } from '../../utils/format';
import { Meter } from './charts';
import { n, off } from './util';

function KV({ k, children }) {
    return <div className={styles.kv}><span className={styles.muted}>{k}</span><span className={styles.text_right}>{children}</span></div>;
}

export default function Servidor({ data }) {
    const s = data.servidor, db = data.banco, r = data.redis, q = data.fila;
    return (
        <Stack gap={3}>
            {off(s) ? <Banner tone="error">Métricas do servidor indisponíveis.</Banner> : (
                <>
                    <div className={styles.card_grid}>
                        <div className={styles.card}><Meter label="CPU" pct={s.cpu_pct} detail={`carga ${s.carga.join(' / ')} (1, 5, 15 min)`} /></div>
                        <div className={styles.card}><Meter label="Memória" pct={s.memoria.pct} detail={`${s.memoria.usado_gb} de ${s.memoria.total_gb} GB · swap ${s.swap_pct}%`} /></div>
                        {s.discos.map((d) => <div key={d.nome} className={styles.card}><Meter label={`Disco — ${d.nome}`} pct={d.pct} detail={`${d.usado_gb} de ${d.total_gb} GB`} /></div>)}
                    </div>
                    <div className={styles.card}>
                        <div className={styles.card_title}>Máquina e aplicação</div>
                        <div>
                            <KV k="Servidor">{s.host} · {s.sistema}</KV>
                            <KV k="Ligado há">{s.ligado_ha_horas} h · {n(s.processos)} processos</KV>
                            <KV k="Aplicação">Python {s.python} · Django {s.django} · {s.app.memoria_mb} MB · {s.app.threads} threads · reiniciada há {s.app.iniciado_ha_horas} h</KV>
                            <KV k="Rede (desde o boot)">{s.rede.enviado_gb} GB enviados · {s.rede.recebido_gb} GB recebidos · {n(s.rede.erros)} erros · {n(s.rede.descartes)} descartes</KV>
                        </div>
                    </div>
                </>
            )}
            <div className={styles.two_col}>
                <div className={styles.card}>
                    <div className={styles.card_title}>Banco de dados</div>
                    {off(db) ? <Banner tone="error">Sem resposta.</Banner> : db.conexoes === undefined ? <div>{db.tipo} · {db.latencia_ms} ms</div> : (
                        <>
                            <Meter label="Conexões em uso" pct={db.conexoes_pct} detail={`${db.conexoes} de ${db.conexoes_max}`} warn={60} crit={80} />
                            <div>
                                <KV k="Versão">PostgreSQL {db.versao}</KV>
                                <KV k="Tamanho">{db.tamanho_gb} GB</KV>
                                <KV k="Latência">{db.latencia_ms} ms</KV>
                                <KV k="Consultas lentas (&gt; 60 s)">{db.consultas_lentas}</KV>
                                <KV k="Cache (acerto)">{db.cache_acerto_pct}%</KV>
                                <KV k="Deadlocks / rollbacks">{n(db.deadlocks)} · {db.rollback_pct}%</KV>
                            </div>
                        </>
                    )}
                </div>
                <div className={styles.card}>
                    <div className={styles.card_title}>Redis (cache e fila)</div>
                    {off(r) ? <Banner tone="error">Sem resposta.</Banner> : (
                        <div>
                            <KV k="Versão">{r.versao}</KV>
                            <KV k="Latência">{r.latencia_ms} ms</KV>
                            <KV k="Memória">{r.memoria_mb} MB{r.memoria_max_mb ? ` de ${r.memoria_max_mb} MB` : ''}</KV>
                            <KV k="Clientes">{n(r.clientes)} ({n(r.bloqueados)} aguardando)</KV>
                            <KV k="Comandos por segundo">{n(r.comandos_por_s)}</KV>
                            <KV k="Conexões rejeitadas">{n(r.conexoes_rejeitadas)}</KV>
                            <KV k="Acerto do cache">{r.acerto_cache_pct ?? '—'}%</KV>
                        </div>
                    )}
                </div>
            </div>
            {!off(q) && (
                <Stack gap={2} className={styles.card}>
                    <div className={styles.card_title}>Tarefas em segundo plano</div>
                    <div className={styles.muted}>{n(q.fila ?? 0)} na fila · {n(q.workers ?? 0)} workers · {n(q.falhas_24h)} falhas em 24 h</div>
                    {q.ultimas_falhas.length > 0 && (
                        <Table flat columns={['Quando', 'Tarefa', 'Erro (mascarado)']}>
                            {q.ultimas_falhas.map((f) => (
                                <tr key={`${f.nome}-${f.quando}`}>
                                    <td>{fmtDateTime(f.quando)}</td>
                                    <td data-label="Tarefa">{f.nome}</td>
                                    <td data-label="Erro (mascarado)" className={`${styles.mono} ${styles.break_all}`}>{f.erro}</td>
                                </tr>
                            ))}
                        </Table>
                    )}
                </Stack>
            )}
        </Stack>
    );
}
