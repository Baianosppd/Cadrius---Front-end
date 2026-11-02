import styles from '../ui/ui.module.css';
import { Button, Pill, Row, StatCard, Stack } from '../ui';
import { HourlyBars, Meter, ScoreRing } from './charts';
import { n, off } from './util';

const LEVEL = { critico: ['red', 'Crítico'], alto: ['orange', 'Alto'], medio: ['yellow', 'Médio'] };

function health(d) {
    return [
        ['Banco', !off(d.banco)], ['Redis', !off(d.redis)], ['Servidor', !off(d.servidor)],
        ['Trilha de auditoria', !off(d.trilha) && d.trilha.integra], ['IA da plataforma', !off(d.ia) && d.ia.ligada],
        ['Sem alerta crítico', !off(d.alertas) && !d.alertas.por_gravidade.critical],
    ];
}

export function Resumo({ data, onGo }) {
    const items = data.prioridades || [];
    return (
        <div className={styles.two_col}>
            <div className={styles.card}>
                <div className={styles.card_title}>Nota de segurança e operação</div>
                <ScoreRing value={data.nota} />
                <div className={styles.card_note}>Começa em 100 e perde pontos por problema aberto, pesando pela gravidade.</div>
                <Row gap={1} className={styles.mt_3}>
                    {health(data).map(([label, ok]) => <Pill key={label} tone={ok ? 'green' : 'red'}>{ok ? '✓' : '✕'} {label}</Pill>)}
                </Row>
            </div>
            <div className={styles.card}>
                <div className={styles.card_title}>O que resolver primeiro{items.length > 5 ? ` (5 de ${items.length})` : ''}</div>
                {items.length === 0 && <div className={styles.muted}>Nada pendente. Tudo em ordem.</div>}
                <Stack gap={0}>
                    {items.slice(0, 5).map((i) => (
                        <div key={i.texto} className={styles.list_row}>
                            <Pill tone={LEVEL[i.nivel]?.[0] || 'gray'}>{LEVEL[i.nivel]?.[1] || i.nivel}</Pill>
                            <span className={styles.flex_1}>{i.texto}</span>
                            <Button size="sm" variant="ghost" onClick={() => onGo(i.onde)}>Ver</Button>
                        </div>
                    ))}
                </Stack>
            </div>
        </div>
    );
}

export function VisaoGeral({ data }) {
    const s = data.servidor, db = data.banco, r = data.redis, q = data.fila, t = data.ameacas, al = data.alertas, ac = data.acessos;
    const disk = !off(s) && s.discos?.length ? s.discos.reduce((a, b) => (b.pct > a.pct ? b : a)) : null;
    return (
        <Stack gap={3}>
            <div className={styles.card_grid}>
                {off(s) ? <StatCard title="Servidor" value="Indisponível" tone="red" /> : (
                    <>
                        <div className={styles.card}><Meter label="CPU" pct={s.cpu_pct} detail={`${s.cpus} núcleo(s) · carga ${s.carga[0]}`} /></div>
                        <div className={styles.card}><Meter label="Memória" pct={s.memoria.pct} detail={`${s.memoria.usado_gb} de ${s.memoria.total_gb} GB`} /></div>
                        {disk && <div className={styles.card}><Meter label={`Disco (${disk.nome})`} pct={disk.pct} detail={`${disk.usado_gb} de ${disk.total_gb} GB`} /></div>}
                    </>
                )}
                {off(db) ? <StatCard title="Banco de dados" value="Sem resposta" tone="red" />
                    : <StatCard title="Banco de dados" value={`${n(db.latencia_ms)} ms`} note={db.conexoes !== undefined ? `${db.conexoes} de ${db.conexoes_max} conexões · ${db.tamanho_gb} GB` : db.tipo} />}
                {off(r) ? <StatCard title="Redis (cache/fila)" value="Sem resposta" tone="red" />
                    : <StatCard title="Redis (cache/fila)" value={`${n(r.latencia_ms)} ms`} note={`${n(r.memoria_mb)} MB · ${n(r.clientes)} clientes`} />}
                {!off(q) && <StatCard title="Tarefas em segundo plano" value={n(q.fila ?? 0)} tone={q.falhas_24h ? 'yellow' : undefined}
                    note={`${n(q.falhas_24h)} falhas e ${n(q.sucessos_24h)} sucessos em 24 h`} />}
                {!off(t) && <StatCard title="Logins com falha (24 h)" value={n(t.falhas_login_24h)} tone={t.falhas_login_24h >= 50 ? 'red' : undefined}
                    note={`${n(t.logins_24h)} logins com sucesso · ${n(t.falhas_login_7d)} falhas em 7 dias`} />}
                {!off(al) && <StatCard title="Alertas abertos" value={n(al.abertos)} tone={al.por_gravidade.critical + al.por_gravidade.high ? 'red' : 'green'}
                    note={`${al.por_gravidade.critical} críticos · ${al.por_gravidade.high} altos`} />}
                {!off(ac) && <StatCard title="Sessões ativas" value={n(ac.sessoes_ativas)} note={`${n(ac.pessoas_com_sessao)} pessoas conectadas`} />}
                {!off(ac) && <StatCard title="MFA dos gestores" value={`${ac.mfa_gestores_pct}%`} tone={ac.mfa_gestores_pct < 50 ? 'yellow' : 'green'}
                    note={`${ac.gestores_com_mfa} de ${ac.gestores} donos/admins · equipe sem MFA: ${ac.equipe_sem_mfa.length}`} />}
            </div>
            {!off(t) && (
                <div className={styles.card}>
                    <div className={styles.card_title}>Tentativas nas últimas 24 horas</div>
                    <HourlyBars data={t.por_hora} />
                </div>
            )}
        </Stack>
    );
}
