import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiRefreshCw, FiShieldOff } from 'react-icons/fi';
import styles from '../../components/seguranca/seguranca.module.css';
import { Banner, Empty, PageHeader, Pill, StatCard, errorMessage, fmtDateTime } from '../../components/seguranca/ui';
import { HourlyBars, Meter, ScoreRing } from '../../components/cyber/charts';
import { backofficeApi } from '../../services/backoffice';
import useLoader from './useLoader';

const TABS = [['geral', 'Visão geral'], ['servidor', 'Servidor'], ['ameacas', 'Ameaças'], ['alertas', 'Alertas'], ['acessos', 'Acessos'],
    ['configuracao', 'Configuração'], ['ia', 'IA'], ['ips', 'IPs bloqueados']];
const LEVEL = { critico: ['red', 'Crítico'], alto: ['orange', 'Alto'], medio: ['yellow', 'Médio'] };
const SEV = { critical: ['red', 'Crítica'], high: ['orange', 'Alta'], medium: ['yellow', 'Média'], low: ['gray', 'Baixa'] };
const ALERT = { open: 'Aberto', ack: 'Em análise', resolved: 'Resolvido', false_positive: 'Falso positivo' };
const REFRESH_S = 30;

function KV({ k, children }) {
    return <div className={styles.kv}><span className={styles.muted}>{k}</span><span style={{ textAlign: 'right' }}>{children}</span></div>;
}

const n = (v) => (v === null || v === undefined ? '—' : Number(v).toLocaleString('pt-BR'));
const off = (block) => !block || block.indisponivel;

// Cibersegurança (CAD-221): monitoramento do sistema e do servidor para a TI, com atualização automática.
export default function Ciberseguranca() {
    const [tab, setTab] = useState('geral');
    const [auto, setAuto] = useState(true);
    const { data, error, loading, reload } = useLoader(() => backofficeApi.cyber(), []);

    useEffect(() => {
        if (!auto) return undefined;
        const id = setInterval(() => { if (document.visibilityState === 'visible') reload(); }, REFRESH_S * 1000);
        return () => clearInterval(id);
    }, [auto, reload]);

    return (
        <div className={styles.page}>
            <PageHeader title="Cibersegurança" subtitle="Sistema e servidor em tempo real"
                actions={(
                    <span className={styles.btn_row}>
                        <label className={styles.check_row}>
                            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Atualizar a cada {REFRESH_S} s
                        </label>
                        <button type="button" className={styles.btn} onClick={reload} disabled={loading}>
                            <FiRefreshCw aria-hidden="true" /> {loading ? 'Atualizando…' : 'Atualizar'}
                        </button>
                    </span>
                )} />
            {error && <Banner tone="error">{error}</Banner>}
            {!data && !error && <Empty>Coletando métricas…</Empty>}
            {data && (
                <>
                    <Overview data={data} onGo={setTab} />
                    <div className={styles.tabs} role="tablist">
                        {TABS.map(([key, label]) => (
                            <button key={key} type="button" role="tab" aria-selected={tab === key}
                                className={`${styles.tab} ${tab === key ? styles.tab_active : ''}`} onClick={() => setTab(key)}>
                                {label}{key === 'alertas' && data.alertas?.abertos ? ` (${data.alertas.abertos})` : ''}
                            </button>
                        ))}
                    </div>
                    {tab === 'geral' && <General data={data} />}
                    {tab === 'servidor' && <Server data={data} />}
                    {tab === 'ameacas' && <Threats data={data} reload={reload} />}
                    {tab === 'alertas' && <Alerts data={data} reload={reload} />}
                    {tab === 'acessos' && <Access a={data.acessos} chain={data.trilha} />}
                    {tab === 'configuracao' && <Config c={data.configuracao} />}
                    {tab === 'ia' && <AI ai={data.ia} />}
                    {tab === 'ips' && <BlockedIps rows={data.ips_bloqueados} reload={reload} />}
                    <div className={styles.muted}>Atualizado em {fmtDateTime(data.gerado_em)}. E-mails aparecem mascarados; nenhum segredo é exibido.</div>
                </>
            )}
        </div>
    );
}

function health(d) {
    return [
        ['Banco', !off(d.banco)], ['Redis', !off(d.redis)], ['Servidor', !off(d.servidor)],
        ['Trilha de auditoria', !off(d.trilha) && d.trilha.integra], ['IA da plataforma', !off(d.ia) && d.ia.ligada],
        ['Sem alerta crítico', !off(d.alertas) && !d.alertas.por_gravidade.critical],
    ];
}

function Overview({ data, onGo }) {
    const items = data.prioridades || [];
    return (
        <div className={styles.two_col}>
            <div className={styles.card}>
                <div className={styles.card_title}>Nota de segurança e operação</div>
                <ScoreRing value={data.nota} />
                <div className={styles.card_note}>Começa em 100 e perde pontos por problema aberto, pesando pela gravidade.</div>
                <div className={styles.btn_row} style={{ marginTop: 'var(--sp-3)' }}>
                    {health(data).map(([label, ok]) => <Pill key={label} tone={ok ? 'green' : 'red'}>{ok ? '✓' : '✕'} {label}</Pill>)}
                </div>
            </div>
            <div className={styles.card}>
                <div className={styles.card_title}>O que resolver primeiro{items.length > 5 ? ` (5 de ${items.length})` : ''}</div>
                {items.length === 0 && <div className={styles.muted}>Nada pendente. Tudo em ordem.</div>}
                <div className={styles.stack}>
                    {items.slice(0, 5).map((i) => (
                        <div key={i.texto} className={styles.list_row}>
                            <Pill tone={LEVEL[i.nivel]?.[0] || 'gray'}>{LEVEL[i.nivel]?.[1] || i.nivel}</Pill>
                            <span style={{ flex: 1 }}>{i.texto}</span>
                            <button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_ghost}`} onClick={() => onGo(i.onde)}>Ver</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function General({ data }) {
    const s = data.servidor, db = data.banco, r = data.redis, q = data.fila, t = data.ameacas, al = data.alertas, ac = data.acessos;
    const disk = !off(s) && s.discos?.length ? s.discos.reduce((a, b) => (b.pct > a.pct ? b : a)) : null;
    return (
        <div className={styles.stack}>
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
        </div>
    );
}

function Server({ data }) {
    const s = data.servidor, db = data.banco, r = data.redis, q = data.fila;
    return (
        <div className={styles.stack}>
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
                <div className={styles.card}>
                    <div className={styles.card_title}>Tarefas em segundo plano</div>
                    <div className={styles.muted}>{n(q.fila ?? 0)} na fila · {n(q.workers ?? 0)} workers · {n(q.falhas_24h)} falhas em 24 h</div>
                    {q.ultimas_falhas.length > 0 && (
                        <div className={styles.table_wrap}><table className={styles.table}>
                            <thead><tr><th>Quando</th><th>Tarefa</th><th>Erro (mascarado)</th></tr></thead>
                            <tbody>{q.ultimas_falhas.map((f) => <tr key={`${f.nome}-${f.quando}`}><td>{fmtDateTime(f.quando)}</td><td>{f.nome}</td><td className={styles.mono}>{f.erro}</td></tr>)}</tbody>
                        </table></div>
                    )}
                </div>
            )}
        </div>
    );
}

function Threats({ data, reload }) {
    const t = data.ameacas;
    const [blocking, setBlocking] = useState(null);
    if (off(t)) return <Banner tone="error">Dados de ameaças indisponíveis.</Banner>;
    return (
        <div className={styles.stack}>
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
                        <div className={styles.table_wrap}><table className={styles.table}>
                            <thead><tr><th>IP</th><th>Falhas de login</th><th>Negados</th><th /></tr></thead>
                            <tbody>{t.ips.map((ip) => (
                                <tr key={ip.ip}><td className={styles.mono}>{ip.ip}</td><td>{ip.falhas_login}</td><td>{ip.negados}</td>
                                    <td>{ip.bloqueado ? <Pill tone="red">Bloqueado</Pill> : (
                                        <button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_danger}`} onClick={() => setBlocking(ip.ip)}>
                                            <FiShieldOff aria-hidden="true" /> Bloquear
                                        </button>
                                    )}</td></tr>
                            ))}</tbody>
                        </table></div>
                    )}
                </div>
                <div className={styles.card}>
                    <div className={styles.card_title}>Contas mais visadas</div>
                    {t.contas_visadas.length === 0 ? <div className={styles.muted}>Nenhuma.</div> : t.contas_visadas.map((c) => (
                        <div key={c.conta} className={styles.list_row}><span className={styles.mono} style={{ flex: 1 }}>{c.conta}</span><span>{c.falhas} falhas</span></div>
                    ))}
                    <div className={styles.card_title} style={{ marginTop: 'var(--sp-4)' }}>Contas travadas agora</div>
                    {t.contas_travadas.length === 0 ? <div className={styles.muted}>Nenhuma.</div> : t.contas_travadas.map((c) => (
                        <div key={`${c.conta}-${c.ip}`} className={styles.list_row}>
                            <span className={styles.mono} style={{ flex: 1 }}>{c.conta}</span><span className={styles.mono}>{c.ip}</span><span>{c.falhas} falhas</span>
                        </div>
                    ))}
                    {t.contas_travadas.length > 0 && <div className={styles.card_note}>Para liberar uma conta: Usuários → "Desbloquear login".</div>}
                </div>
            </div>
            {blocking && <BlockModal initial={blocking} onClose={() => setBlocking(null)} onDone={() => { setBlocking(null); reload(); }} />}
        </div>
    );
}

function Alerts({ data, reload }) {
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
        <div className={styles.table_wrap}><table className={styles.table}>
            <thead><tr><th>Quando</th><th>Gravidade</th><th>Regra</th><th>Resumo</th><th>IP</th><th>Situação</th></tr></thead>
            <tbody>{al.recentes.map((a) => (
                <tr key={a.id}>
                    <td>{fmtDateTime(a.quando)}</td>
                    <td><Pill tone={SEV[a.gravidade]?.[0]}>{SEV[a.gravidade]?.[1] || a.gravidade}</Pill></td>
                    <td className={styles.mono}>{a.regra}</td><td>{a.resumo}</td><td className={styles.mono}>{a.ip || '—'}</td>
                    <td>
                        <select className={styles.select} value={a.status} aria-label={`Situação do alerta ${a.id}`}
                            onChange={(e) => review(a.id, e.target.value)}>
                            {Object.entries(ALERT).map(([k, v]) => <option key={k} value={k} disabled={k === 'open'}>{v}</option>)}
                        </select>
                    </td>
                </tr>
            ))}</tbody>
        </table></div>
    );
}

function Access({ a, chain }) {
    if (off(a)) return <Banner tone="error">Dados de acesso indisponíveis.</Banner>;
    return (
        <div className={styles.stack}>
            <div className={styles.card_grid}>
                <StatCard title="Usuários ativos" value={n(a.usuarios_ativos)} note={`${n(a.escritorios_ativos)} escritórios`} />
                <StatCard title="Sessões ativas" value={n(a.sessoes_ativas)} note={`${n(a.pessoas_com_sessao)} pessoas`} />
                <StatCard title="Equipe Cadrius" value={n(a.equipe)} note={`${a.equipe_sem_mfa.length} sem verificação em duas etapas`} tone={a.equipe_sem_mfa.length ? 'red' : 'green'} />
                <StatCard title="Superusuários" value={n(a.superusuarios)} note="mantenha o mínimo possível" tone={a.superusuarios > 2 ? 'yellow' : undefined} />
                <StatCard title="MFA de donos/admins" value={`${a.mfa_gestores_pct}%`} note={`${a.gestores_com_mfa} de ${a.gestores}`} />
                <StatCard title="Troca de senha pendente" value={n(a.troca_de_senha_pendente)} note="senhas temporárias da TI" />
                <StatCard title="Sem acesso há 90 dias" value={n(a.sem_acesso_90_dias)} note="avalie desativar" tone={a.sem_acesso_90_dias ? 'yellow' : undefined} />
                {!off(chain) && <StatCard title="Trilha de auditoria" value={chain.integra ? 'Íntegra' : 'FALHA'} tone={chain.integra ? 'green' : 'red'} note={`${n(chain.verificados)} eventos conferidos`} />}
            </div>
            {a.equipe_sem_mfa.length > 0 && (
                <Banner tone="warn">Sem verificação em duas etapas: {a.equipe_sem_mfa.join(', ')}. Elas só entram na Gestão depois de ativar.</Banner>
            )}
        </div>
    );
}

function Config({ c }) {
    if (off(c)) return <Banner tone="error">Configuração indisponível.</Banner>;
    const tone = { pass: ['green', 'OK'], partial: ['yellow', 'Parcial'], fail: ['red', 'Falha'], na: ['gray', 'N/A'] };
    return (
        <div className={styles.two_col}>
            <div className={styles.card}>
                <div className={styles.card_title}>Proteções do servidor web</div>
                {c.cabecalhos.map((h) => (
                    <div key={h.item} className={styles.list_row}>
                        <Pill tone={h.ok ? 'green' : 'red'}>{h.ok ? 'Ativo' : 'Inativo'}</Pill><span style={{ flex: 1 }}>{h.item}</span>
                    </div>
                ))}
            </div>
            <div className={styles.card}>
                <div className={styles.card_title}>Verificações automáticas ({c.falhas.length} com falha)</div>
                <div className={styles.stack}>
                    {c.verificacoes.map((v) => (
                        <div key={v.nome} className={styles.list_row}>
                            <Pill tone={tone[v.status]?.[0] || 'gray'}>{tone[v.status]?.[1] || v.status}</Pill>
                            <span style={{ flex: 1 }}><strong>{v.titulo}</strong><br /><span className={styles.muted}>{v.detalhe}</span></span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function AI({ ai }) {
    if (off(ai)) return <Banner tone="error">Dados de IA indisponíveis.</Banner>;
    return (
        <div className={styles.stack}>
            <div className={styles.card_grid}>
                <StatCard title="IA da plataforma" value={ai.ligada ? 'Ligada' : 'DESLIGADA'} tone={ai.ligada ? 'green' : 'red'} note="chave geral em Sistema e operação" />
                <StatCard title="Pedidos de IA (24 h)" value={n(ai.pedidos_24h)} note={`${n(ai.falhas_24h)} falharam`} />
                <StatCard title="Bloqueados pela política" value={n(ai.bloqueados_24h)} />
            </div>
            <div className={styles.table_wrap}><table className={styles.table}>
                <thead><tr><th>Provedor</th><th>Configurado</th><th>Plano gratuito</th><th>Dados de clientes</th><th>Onde roda</th></tr></thead>
                <tbody>{ai.provedores.map((p) => (
                    <tr key={p.chave}>
                        <td><strong>{p.nome}</strong></td>
                        <td>{p.configurado ? <Pill tone="green">Sim</Pill> : <Pill tone="gray">Não</Pill>}</td>
                        <td>{p.gratuito || '—'}</td>
                        <td>{p.treina_com_dados ? <Pill tone="yellow">Bloqueado (treina com os dados)</Pill> : <Pill tone="green">Permitido</Pill>}</td>
                        <td>{p.local ? 'No nosso servidor' : p.regiao}</td>
                    </tr>
                ))}</tbody>
            </table></div>
            <div className={styles.muted}>As chaves ficam só no servidor (.env). Nunca envie chaves por chat, e-mail ou GitHub.</div>
        </div>
    );
}

function BlockedIps({ rows, reload }) {
    const [open, setOpen] = useState(false);
    if (off(rows)) return <Banner tone="error">Lista indisponível.</Banner>;
    const remove = async (id) => {
        try {
            await backofficeApi.unblockIp(id);
            toast.success('IP liberado.');
            reload();
        } catch (e) {
            toast.error(errorMessage(e));
        }
    };
    return (
        <div className={styles.stack}>
            <div className={styles.btn_row}>
                <button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={() => setOpen(true)}><FiShieldOff aria-hidden="true" /> Bloquear IP ou faixa</button>
            </div>
            {rows.length === 0 ? <Empty title="Nenhum IP bloqueado">Bloqueie endereços que insistem em ataques de senha ou varredura (dá para escolher um prazo).</Empty> : (
                <div className={styles.table_wrap}><table className={styles.table}>
                    <thead><tr><th>IP / faixa</th><th>Motivo</th><th>Situação</th><th>Tentativas barradas</th><th>Criado</th><th /></tr></thead>
                    <tbody>{rows.map((b) => (
                        <tr key={b.id}>
                            <td className={styles.mono}>{b.rede}</td><td>{b.motivo}</td>
                            <td>{b.ativo ? <Pill tone="red">{b.expira_em ? `Até ${fmtDateTime(b.expira_em)}` : 'Permanente'}</Pill> : <Pill tone="gray">Expirado</Pill>}</td>
                            <td>{n(b.tentativas_barradas)}{b.ultima_tentativa ? ` · última ${fmtDateTime(b.ultima_tentativa)}` : ''}</td>
                            <td>{fmtDateTime(b.criado_em)}</td>
                            <td><button type="button" className={`${styles.btn} ${styles.btn_sm}`} onClick={() => remove(b.id)}>Liberar</button></td>
                        </tr>
                    ))}</tbody>
                </table></div>
            )}
            {open && <BlockModal onClose={() => setOpen(false)} onDone={() => { setOpen(false); reload(); }} />}
        </div>
    );
}

function BlockModal({ initial = '', onClose, onDone }) {
    const [rede, setRede] = useState(initial);
    const [horas, setHoras] = useState('24');
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const submit = async (e) => {
        e.preventDefault();
        if (reason.trim().length < 10) { setError('Informe o motivo (mínimo 10 caracteres).'); return; }
        setBusy(true);
        setError('');
        try {
            await backofficeApi.blockIp({ rede: rede.trim(), horas: horas === 'sempre' ? '' : horas, reason: reason.trim() });
            toast.success('IP bloqueado em todo o sistema.');
            onDone();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };
    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="block-title">
            <form className={styles.modal} onSubmit={submit}>
                <div className={styles.modal_title} id="block-title">Bloquear IP ou faixa</div>
                <label className={styles.field}>IP ou faixa (CIDR)
                    <input className={styles.input} value={rede} onChange={(e) => setRede(e.target.value)} placeholder="203.0.113.7 ou 203.0.113.0/24" required />
                </label>
                <label className={styles.field}>Prazo
                    <select className={styles.select} value={horas} onChange={(e) => setHoras(e.target.value)}>
                        <option value="1">1 hora</option><option value="24">24 horas</option><option value="168">7 dias</option>
                        <option value="720">30 dias</option><option value="sempre">Até liberar manualmente</option>
                    </select>
                </label>
                <label className={styles.field}>Motivo (fica na auditoria)
                    <textarea className={styles.textarea} value={reason} maxLength={255} onChange={(e) => setReason(e.target.value)} />
                </label>
                <Banner tone="warn">Bloqueia o acesso a todo o Cadrius a partir desse endereço. Redes internas e o seu próprio IP não podem ser bloqueados.</Banner>
                {error && <Banner tone="error">{error}</Banner>}
                <div className={styles.btn_row}>
                    <button type="submit" className={`${styles.btn} ${styles.btn_danger}`} disabled={busy}>{busy ? 'Bloqueando…' : 'Bloquear'}</button>
                    <button type="button" className={styles.btn} onClick={onClose} disabled={busy}>Cancelar</button>
                </div>
            </form>
        </div>
    );
}

