import { Link, useOutletContext } from 'react-router-dom';
import styles from '../../components/seguranca/seguranca.module.css';
import { Banner, Empty, PageHeader, StatCard, StatusPill } from '../../components/seguranca/ui';
import { SUB_STATE, backofficeApi, hasArea } from '../../services/backoffice';
import { brl } from '../../services/financeiro';
import useLoader from './useLoader';

export default function Visao() {
    const { areas } = useOutletContext();
    const { data, error, reload } = useLoader(backofficeApi.overview);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Empty>Carregando…</Empty>;
    const { escritorios: e, usuarios: u, ti, financeiro: f } = data;
    return (
        <div className={styles.page}>
            <PageHeader title="Visão geral" subtitle="Situação da plataforma Cadrius agora"
                actions={<button type="button" className={styles.btn} onClick={reload}>Atualizar</button>} />
            <div className={styles.grid}>
                <StatCard title="Escritórios ativos" value={e.ativos} note={`${e.total} no total · ${e.novos_30d} novos em 30 dias`} />
                <StatCard title="Usuários ativos" value={u.total} note={`${u.acessaram_24h} acessaram em 24 h · ${u.acessaram_30d} em 30 dias`} />
                {ti && <StatCard title="Falhas na fila (24 h)" value={ti.falhas_fila_24h} tone={ti.falhas_fila_24h ? 'red' : 'green'}
                    note={`Fila: ${ti.fila ?? '—'} · workers: ${ti.workers ?? '—'}`} />}
                {f && <StatCard title="MRR (tabela)" value={brl(f.mrr_tabela_brl)} note={`${f.assinantes_pagantes} pagantes · ticket ${brl(f.ticket_medio_brl)}`} />}
                {f && <StatCard title="Testes acabando (7 dias)" value={f.trials_terminando_em_7_dias} tone={f.trials_terminando_em_7_dias ? 'yellow' : undefined} />}
                {data.fiscal && <StatCard title="Recebido no mês" value={brl(data.fiscal.total_brl)} note={`${data.fiscal.nf_pendentes} NF pendentes`}
                    tone={data.fiscal.nf_pendentes ? 'yellow' : undefined} />}
            </div>
            <div className={styles.card}>
                <div className={styles.section_title}>Assinaturas por estado</div>
                <div className={styles.btn_row}>
                    {Object.entries(e.por_estado).map(([st, n]) => (
                        <Link key={st} to={`/gestao/escritorios?estado=${st}`} style={{ textDecoration: 'none' }}>
                            <StatusPill map={SUB_STATE} value={st} /> <strong>{n}</strong>
                        </Link>
                    ))}
                </div>
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
            {!hasArea(areas, 'ti') && !hasArea(areas, 'financeiro') && <Banner tone="warn">Sem área atribuída.</Banner>}
        </div>
    );
}
