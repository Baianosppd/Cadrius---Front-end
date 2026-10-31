import { Link, useOutletContext } from 'react-router-dom';
import { FiRefreshCw } from 'react-icons/fi';
import styles from '../../components/ui/ui.module.css';
import { Banner, Button, Loading, PageHeader, Row, StatCard, StatusPill, Table } from '../../components/ui';
import g from '../../components/gestao/Gestao.module.css';
import { SUB_STATE, backofficeApi, hasArea } from '../../services/backoffice';
import { brl } from '../../services/financeiro';
import useLoader from '../../hooks/useLoader';

export default function Visao() {
    const { areas } = useOutletContext();
    const { data, error, reload } = useLoader(backofficeApi.overview);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    const { escritorios: e, usuarios: u, ti, financeiro: f } = data;
    return (
        <div className={styles.page}>
            <PageHeader title="Visão geral" subtitle="Situação da plataforma Cadrius agora"
                actions={<Button icon={FiRefreshCw} onClick={reload}>Atualizar</Button>} />
            <div className={styles.grid}>
                <StatCard title="Escritórios ativos" value={e.ativos} note={`${e.total} no total · ${e.novos_30d} novos em 30 dias`} />
                <StatCard title="Usuários ativos" value={u.total} note={`${u.acessaram_24h} acessaram em 24 h · ${u.acessaram_30d} em 30 dias`} />
                {ti && <StatCard title="Falhas na fila (24 h)" value={ti.falhas_fila_24h} tone={ti.falhas_fila_24h ? 'red' : 'green'}
                    note={`Fila: ${ti.fila ?? '—'} · workers: ${ti.workers ?? '—'}`} />}
                {f && <StatCard title="MRR (tabela)" value={brl(f.mrr_tabela_brl)} note={`${f.assinantes_pagantes} pagantes · ticket ${brl(f.ticket_medio_brl)}`} />}
                {f && <StatCard title="Testes acabando (7 dias)" value={f.trials_terminando_em_7_dias} tone={f.trials_terminando_em_7_dias ? 'yellow' : undefined} />}
                {data.fiscal && <StatCard title="Recebido no mês" value={brl(data.fiscal.total_brl)} note={`${data.fiscal.nf_pendentes} NF pendentes`}
                    tone={data.fiscal.nf_pendentes ? 'yellow' : undefined} />}
                {f && <StatCard title="Inadimplentes" value={f.inadimplentes ?? 0} tone={f.inadimplentes ? 'red' : 'green'} note="Pagamento pendente ou restrito" />}
                {data.conformidade && <StatCard title="Regras: cliente sem aprovação" value={data.conformidade.regras_cliente_sem_aprovacao}
                    note={`${data.conformidade.regras_ligadas} regras ligadas em ${data.conformidade.escritorios_com_regras} escritório(s)`}
                    tone={data.conformidade.regras_cliente_sem_aprovacao ? 'yellow' : 'green'} />}
                {data.parametrizacoes_abertas != null && <StatCard title="Parametrizações em aberto" value={data.parametrizacoes_abertas}
                    note={<Link to="/gestao/suporte">Ver fila</Link>} />}
            </div>
            <div className={styles.card}>
                <div className={styles.section_title}>Assinaturas por estado</div>
                <Row>
                    {Object.entries(e.por_estado).map(([st, n]) => (
                        <Link key={st} to={`/gestao/escritorios?estado=${st}`} className={g.state_link}>
                            <StatusPill map={SUB_STATE} value={st} /> <strong>{n}</strong>
                        </Link>
                    ))}
                </Row>
            </div>
            {f && (
                <div className={styles.card}>
                    <div className={styles.section_title}>Financeiro (30 dias)</div>
                    <div className={styles.kv}><span>Pacotes de créditos vendidos</span><strong>{f.pacotes_30d.creditos_vendidos} créditos · {brl(f.pacotes_30d.receita_brl)}</strong></div>
                    <div className={styles.kv}><span>Créditos de cortesia concedidos</span><strong>{f.creditos_cortesia_30d ?? 0}</strong></div>
                    <div className={styles.kv}><span>Promoções ativas / usos</span><strong>{f.promocoes_ativas} / {f.usos_de_promocao}</strong></div>
                    <div className={styles.kv}><span>Pagantes por plano</span>
                        <strong>{Object.entries(f.assinantes_por_plano).map(([p, n]) => `${p}: ${n}`).join(' · ') || '—'}</strong></div>
                </div>
            )}
            {f?.tendencia_12m && (
                <Table columns={['Mês', 'Receita recebida', 'Escritórios novos', 'Cancelamentos', 'Churn']}>
                    {[...f.tendencia_12m].reverse().map((m) => (
                        <tr key={m.mes}>
                            <td>{m.mes.split('-').reverse().join('/')}</td>
                            <td data-label="Receita recebida">{brl(m.receita_brl)}</td>
                            <td data-label="Escritórios novos">{m.novos_escritorios}</td>
                            <td data-label="Cancelamentos">{m.cancelamentos}</td>
                            <td data-label="Churn">{m.churn_pct}%</td>
                        </tr>
                    ))}
                </Table>
            )}
            {!hasArea(areas, 'ti') && !hasArea(areas, 'financeiro') && <Banner tone="warn">Sem área atribuída.</Banner>}
        </div>
    );
}
