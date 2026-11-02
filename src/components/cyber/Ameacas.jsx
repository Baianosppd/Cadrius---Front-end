import { useState } from 'react';
import { FiShieldOff } from 'react-icons/fi';
import styles from '../ui/ui.module.css';
import { Banner, Button, Pill, StatCard, Stack, Table } from '../ui';
import { HourlyBars } from './charts';
import { BlockModal } from './IpsBloqueados';
import { n, off } from './util';

export default function Ameacas({ data, reload }) {
    const t = data.ameacas;
    const [blocking, setBlocking] = useState(null);
    if (off(t)) return <Banner tone="error">Dados de ameaças indisponíveis.</Banner>;
    return (
        <Stack gap={3}>
            <div className={styles.card_grid}>
                <StatCard title="Logins com falha (24 h)" value={n(t.falhas_login_24h)} note={`${n(t.falhas_login_7d)} em 7 dias`} />
                <StatCard title="Contas travadas por tentativas" value={n(t.bloqueios_24h)} tone={t.bloqueios_24h ? 'yellow' : undefined} />
                <StatCard title="Acessos negados" value={n(t.negados_24h)} note="tentativas fora da permissão" />
                <StatCard title="Limite de requisições" value={n(t.limite_de_taxa_24h)} note="robôs/força bruta barrados" />
                <StatCard title="Webhooks com token inválido" value={n(t.webhooks_invalidos_24h)} tone={t.webhooks_invalidos_24h ? 'yellow' : undefined} />
                <StatCard title="Ações administrativas" value={n(t.acoes_admin_24h)} note={`${n(t.exportacoes_24h)} exportações`} />
            </div>
            <div className={styles.card}>
                <div className={styles.card_title}>Por hora (24 h)</div>
                <HourlyBars data={t.por_hora} />
            </div>
            <div className={styles.two_col}>
                <div className={styles.card}>
                    <div className={styles.card_title}>IPs mais ativos em falhas</div>
                    {t.ips.length === 0 ? <div className={styles.muted}>Nenhum IP com falhas nas últimas 24 h.</div> : (
                        <Table flat columns={['IP', 'Falhas de login', 'Negados', { label: '', className: styles.td_actions }]}>
                            {t.ips.map((ip) => (
                                <tr key={ip.ip}>
                                    <td className={styles.mono}>{ip.ip}</td>
                                    <td data-label="Falhas de login">{ip.falhas_login}</td>
                                    <td data-label="Negados">{ip.negados}</td>
                                    <td className={styles.td_actions}>{ip.bloqueado ? <Pill tone="red">Bloqueado</Pill> : (
                                        <Button size="sm" variant="danger" icon={FiShieldOff} onClick={() => setBlocking(ip.ip)}>Bloquear</Button>
                                    )}</td>
                                </tr>
                            ))}
                        </Table>
                    )}
                </div>
                <div className={styles.card}>
                    <div className={styles.card_title}>Contas mais visadas</div>
                    {t.contas_visadas.length === 0 ? <div className={styles.muted}>Nenhuma.</div> : t.contas_visadas.map((c) => (
                        <div key={c.conta} className={styles.list_row}><span className={`${styles.mono} ${styles.flex_1}`}>{c.conta}</span><span>{c.falhas} falhas</span></div>
                    ))}
                    <div className={`${styles.card_title} ${styles.mt_4}`}>Contas travadas agora</div>
                    {t.contas_travadas.length === 0 ? <div className={styles.muted}>Nenhuma.</div> : t.contas_travadas.map((c) => (
                        <div key={`${c.conta}-${c.ip}`} className={styles.list_row}>
                            <span className={`${styles.mono} ${styles.flex_1}`}>{c.conta}</span><span className={styles.mono}>{c.ip}</span><span>{c.falhas} falhas</span>
                        </div>
                    ))}
                    {t.contas_travadas.length > 0 && <div className={styles.card_note}>Para liberar uma conta: Usuários → "Desbloquear login".</div>}
                </div>
            </div>
            {blocking && <BlockModal initial={blocking} onClose={() => setBlocking(null)} onDone={() => { setBlocking(null); reload(); }} />}
        </Stack>
    );
}
