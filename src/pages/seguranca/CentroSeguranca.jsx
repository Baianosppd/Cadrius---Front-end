import { Fragment, useEffect, useState } from 'react';
import api from '../../services/api';
import TabBar from '../../components/ui/TabBar';
import styles from '../../components/seguranca/seguranca.module.css';
import {
    Banner, CHECK_STATUS, CONTROL_STATUS, Empty, PageHeader, Pill, ScoreBar, StatCard, StatusPill, fmtDate, errorMessage,
} from '../../components/seguranca/ui';

const FW_LABEL = { iso27001: 'ISO/IEC 27001', iso27701: 'ISO/IEC 27701', lgpd: 'LGPD' };

function useLoad(url, params) {
    const [state, setState] = useState({ data: null, error: null });
    const key = JSON.stringify(params || {});
    useEffect(() => {
        let alive = true;
        setState({ data: null, error: null });
        api.get(url, { params })
            .then((r) => alive && setState({ data: r.data, error: null }))
            .catch((e) => alive && setState({ data: null, error: errorMessage(e) }));
        return () => { alive = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, key]);
    return state;
}

function Visao() {
    const { data, error } = useLoad('security/overview/');
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Empty>Carregando…</Empty>;
    const { audit, alerts_open: al, ai } = data;
    return (
        <div className={styles.page}>
            {!audit.chain_ok && <Banner tone="error"><strong>Cadeia de auditoria inconsistente.</strong> Possível adulteração — acione o plano de resposta a incidentes.</Banner>}
            <div className={styles.grid}>
                <StatCard title="Conformidade geral" value={`${Math.round(data.overall_score)}%`} tone={data.overall_score >= 80 ? 'green' : data.overall_score >= 50 ? 'yellow' : 'red'} />
                <StatCard title="Integridade da trilha" value={audit.chain_ok ? 'Íntegra' : 'FALHA'} tone={audit.chain_ok ? 'green' : 'red'} note={`${audit.chain_checked} eventos verificados`} />
                <StatCard title="Eventos (24 h)" value={audit.events_24h} note={`${audit.denied_24h} negados · ${audit.failed_logins_24h} logins com falha`} />
                <StatCard title="Alertas críticos/altos" value={al.critical + al.high} tone={al.critical + al.high > 0 ? 'red' : 'green'} note={`${al.medium} médios · ${al.low} baixos`} />
                <StatCard title="IA (24 h)" value={ai.requests_24h} note={`${ai.blocked_24h} bloqueadas · ${ai.global_enabled ? 'chave geral LIGADA' : 'chave geral DESLIGADA'}`} tone={ai.global_enabled ? undefined : 'red'} />
            </div>
            <div className={styles.section_title}>Normas</div>
            <div className={styles.grid}>
                {Object.entries(data.frameworks).map(([fw, f]) => (
                    <div key={fw} className={styles.card}>
                        <div className={styles.card_title}>{f.title || FW_LABEL[fw]}</div>
                        <div className={styles.card_value}>{Math.round(f.score)}%</div>
                        <ScoreBar value={f.score} />
                        <div className={styles.card_note}>
                            {Object.entries(f.counts).map(([k, v]) => `${CONTROL_STATUS[k]?.label || k}: ${v}`).join(' · ')}
                        </div>
                    </div>
                ))}
            </div>
            <div className={styles.section_title}>Verificações técnicas com falha</div>
            {data.failing_checks.length === 0 ? <Banner tone="ok">Nenhuma verificação automática falhando.</Banner> : (
                <div className={styles.table_wrap}><table className={styles.table}><tbody>
                    {data.failing_checks.map((c) => <tr key={c.name}><td><strong>{c.title}</strong></td><td className={styles.muted}>{c.detail}</td></tr>)}
                </tbody></table></div>
            )}
        </div>
    );
}

function Normas() {
    const [framework, setFramework] = useState('iso27001');
    const [status, setStatus] = useState('');
    const [open, setOpen] = useState(null);
    const { data, error } = useLoad('security/controls/', { framework, ...(status ? { status } : {}) });

    return (
        <div className={styles.page}>
            <div className={styles.filters}>
                <label className={styles.field}>Norma
                    <select className={styles.select} value={framework} onChange={(e) => { setFramework(e.target.value); setOpen(null); }}>
                        {Object.entries(FW_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                </label>
                <label className={styles.field}>Situação
                    <select className={styles.select} value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="">Todas</option>
                        {Object.entries(CONTROL_STATUS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
                    </select>
                </label>
            </div>
            {error && <Banner tone="error">{error}</Banner>}
            {!data && !error && <Empty>Carregando…</Empty>}
            {data && (
                <>
                    <div className={styles.card}>
                        <div className={styles.card_title}>Aderência — {data.title}</div>
                        <div className={styles.card_value}>{Math.round(data.score)}%</div>
                        <ScoreBar value={data.score} />
                    </div>
                    <div className={styles.table_wrap}>
                        <table className={styles.table}>
                            <thead><tr><th>Controle</th><th>Tema</th><th>Título</th><th>Situação</th><th>Origem</th><th /></tr></thead>
                            <tbody>
                                {data.controls.map((c) => (
                                    <Fragment key={c.id}>
                                        <tr>
                                            <td className={styles.mono}>{c.id}</td><td>{c.theme}</td><td>{c.title}</td>
                                            <td><StatusPill map={CONTROL_STATUS} value={c.status} /></td>
                                            <td className={styles.muted}>{{ auto: 'Automática', manual: 'Manual', mixed: 'Mista' }[c.source] || c.source}</td>
                                            <td><button className={styles.btn} onClick={() => setOpen(open === c.id ? null : c.id)}>{open === c.id ? 'Ocultar' : 'Detalhes'}</button></td>
                                        </tr>
                                        {open === c.id && (
                                            <tr><td colSpan={6}>
                                                {c.evidence && <p><strong>Como o Cadrius atende:</strong> {c.evidence}</p>}
                                                {c.checks.map((k) => <div key={k.name} className={styles.kv}><span>{k.title}</span><span><StatusPill map={CHECK_STATUS} value={k.status} /> <span className={styles.muted}>{k.detail}</span></span></div>)}
                                                {c.assessment && <p className={styles.muted}>Responsável: {c.assessment.owner || '—'} · Revisado em {fmtDate(c.assessment.reviewed_at)} · Próxima revisão {fmtDate(c.assessment.next_review_at)}{c.assessment.justification ? ` · ${c.assessment.justification}` : ''}</p>}
                                            </td></tr>
                                        )}
                                    </Fragment>
                                ))}
                            </tbody>
                        </table>
                        {data.controls.length === 0 && <Empty>Nenhum controle com esse filtro.</Empty>}
                    </div>
                    <p className={styles.muted}>Avaliações manuais (responsável, evidência, justificativa) são registradas no painel administrativo do Centro de Segurança.</p>
                </>
            )}
        </div>
    );
}

function Postura() {
    const { data, error } = useLoad('security/checks/');
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Empty>Carregando…</Empty>;
    return (
        <div className={styles.table_wrap}>
            <table className={styles.table}>
                <thead><tr><th>Verificação</th><th>Resultado</th><th>Detalhe</th></tr></thead>
                <tbody>{data.map((c) => <tr key={c.name}><td>{c.title}</td><td><StatusPill map={CHECK_STATUS} value={c.status} /></td><td className={styles.muted}>{c.detail}</td></tr>)}</tbody>
            </table>
        </div>
    );
}

function Ropa() {
    const { data, error } = useLoad('security/ropa/');
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Empty>Carregando…</Empty>;
    return (
        <div className={styles.page}>
            <p className={styles.muted}>Registro das operações de tratamento (LGPD art. 37 / ISO 27701 7.2.8).</p>
            {data.map((p) => (
                <div key={p.id} className={styles.card}>
                    <div className={styles.header_row}><strong>{p.id} — {p.name}</strong><Pill tone={p.role === 'controlador' ? 'blue' : 'gray'}>{p.role}</Pill></div>
                    <div className={styles.kv}><span>Finalidade</span><span>{p.purpose}</span></div>
                    <div className={styles.kv}><span>Base legal</span><span>{p.legal_basis}</span></div>
                    <div className={styles.kv}><span>Titulares</span><span>{p.data_subjects}</span></div>
                    <div className={styles.kv}><span>Dados</span><span>{(p.data_categories || []).join('; ')}</span></div>
                    <div className={styles.kv}><span>Compartilhamento</span><span>{p.recipients}</span></div>
                    <div className={styles.kv}><span>Transferência internacional</span><span>{p.international_transfer}</span></div>
                    <div className={styles.kv}><span>Retenção</span><span>{p.retention}</span></div>
                    <div className={styles.kv}><span>Segurança</span><span>{p.security}</span></div>
                </div>
            ))}
        </div>
    );
}

export default function CentroSeguranca() {
    const [tab, setTab] = useState('visao');
    return (
        <div className={styles.page}>
            <PageHeader title="Centro de Segurança" subtitle="ISO 27001, ISO 27701 e LGPD" />
            <TabBar
                tabs={[{ id: 'visao', label: 'Visão geral' }, { id: 'normas', label: 'Normas' }, { id: 'postura', label: 'Postura técnica' }, { id: 'ropa', label: 'RoPA (LGPD)' }]}
                activeTab={tab} onTabChange={setTab}
            />
            {tab === 'visao' && <Visao />}
            {tab === 'normas' && <Normas />}
            {tab === 'postura' && <Postura />}
            {tab === 'ropa' && <Ropa />}
        </div>
    );
}
