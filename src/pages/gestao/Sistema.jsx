import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../../components/seguranca/seguranca.module.css';
import { Banner, CHECK_STATUS, Empty, PageHeader, Pill, StatCard, StatusPill, errorMessage, fmtDateTime } from '../../components/seguranca/ui';
import { CONFIG_LABEL, MIN_REASON, backofficeApi } from '../../services/backoffice';
import useLoader from './useLoader';

function KillSwitch({ ia, onChanged }) {
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const toggle = async () => {
        if (ia.ligada && reason.trim().length < MIN_REASON) { toast.error(`Informe o motivo (mínimo ${MIN_REASON} caracteres).`); return; }
        setBusy(true);
        try {
            await backofficeApi.aiSwitch({ enabled: !ia.ligada, reason: reason.trim() });
            toast.success(ia.ligada ? 'IA da plataforma DESLIGADA.' : 'IA da plataforma religada.');
            setReason('');
            onChanged();
        } catch (e) {
            toast.error(errorMessage(e));
        } finally {
            setBusy(false);
        }
    };
    return (
        <div className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className={styles.section_title}>IA da plataforma (kill switch global)</div>
            <div>{ia.ligada ? <Pill tone="green">Ligada</Pill> : <Pill tone="red">Desligada</Pill>}
                {' '}<span className={styles.muted}>{ia.motivo && `Motivo: ${ia.motivo} · `}alterado em {fmtDateTime(ia.alterado_em)}</span></div>
            {ia.ligada && (
                <label className={styles.field}>Motivo para desligar (incidente, provedor fora, vazamento suspeito…)
                    <input className={styles.input} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={255} />
                </label>
            )}
            <div><button type="button" className={`${styles.btn} ${ia.ligada ? styles.btn_danger : styles.btn_primary}`} disabled={busy} onClick={toggle}>
                {ia.ligada ? 'Desligar a IA de todos os escritórios' : 'Religar a IA'}
            </button></div>
        </div>
    );
}

export default function Sistema() {
    const { data, error, reload, loading } = useLoader(backofficeApi.health);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Empty>Carregando…</Empty>;
    const { servicos: s, fila, config, ia_global: ia, verificacoes } = data;
    const failing = verificacoes.filter((v) => v.status === 'fail');
    return (
        <div className={styles.page}>
            <PageHeader title="Sistema e operação" subtitle={`Versão ${config.versao}${config.debug ? ' · DEBUG LIGADO' : ''}`}
                actions={<button type="button" className={styles.btn} onClick={reload} disabled={loading}>Atualizar</button>} />
            <div className={styles.grid}>
                <StatCard title="Banco de dados" value={s.banco.status === 'ok' ? 'OK' : 'Erro'} tone={s.banco.status === 'ok' ? 'green' : 'red'}
                    note={s.banco.ms != null ? `${s.banco.ms} ms` : undefined} />
                <StatCard title="Redis (cache/fila)" value={s.cache_redis.status === 'ok' ? 'OK' : 'Erro'} tone={s.cache_redis.status === 'ok' ? 'green' : 'red'}
                    note={s.cache_redis.ms != null ? `${s.cache_redis.ms} ms` : undefined} />
                <StatCard title="Tarefas na fila" value={fila.fila ?? '—'} note={`Workers ativos: ${fila.workers ?? '—'}`} />
                <StatCard title="Falhas (24 h)" value={fila.falhas_24h} tone={fila.falhas_24h ? 'red' : 'green'} note={`${fila.sucessos_24h} sucessos`} />
                <StatCard title="Verificações com falha" value={failing.length} tone={failing.length ? 'red' : 'green'} note={`${verificacoes.length} verificações`} />
            </div>
            <KillSwitch ia={ia} onChanged={reload} />
            <div className={styles.card}>
                <div className={styles.section_title}>Configuração (só se existe — os segredos nunca aparecem aqui)</div>
                <div className={styles.btn_row}>
                    {Object.entries(CONFIG_LABEL).map(([k, label]) => <Pill key={k} tone={config[k] ? 'green' : 'gray'}>{label}: {config[k] ? 'sim' : 'não'}</Pill>)}
                    <Pill tone={config.noticias_fontes ? 'green' : 'gray'}>Fontes de notícias: {config.noticias_fontes}</Pill>
                    {config.email_provedor && <Pill tone="blue">E-mail via {config.email_provedor}</Pill>}
                </div>
            </div>
            <div className={styles.section_title}>Rotinas agendadas</div>
            <div className={styles.table_wrap}>
                <table className={styles.table}>
                    <thead><tr><th>Rotina</th><th>Comando</th><th>Próxima execução</th></tr></thead>
                    <tbody>
                        {fila.rotinas.length === 0 && <tr><td colSpan={3}><Empty>Nenhuma rotina agendada. Rode: python manage.py setup_security_schedules</Empty></td></tr>}
                        {fila.rotinas.map((r) => <tr key={r.nome}><td>{r.nome}</td><td className={styles.mono}>{r.comando}</td><td>{fmtDateTime(r.proxima)}</td></tr>)}
                    </tbody>
                </table>
            </div>
            <div className={styles.section_title}>Últimas falhas da fila</div>
            <div className={styles.table_wrap}>
                <table className={styles.table}>
                    <thead><tr><th>Quando</th><th>Tarefa</th><th>Erro (dados pessoais mascarados)</th></tr></thead>
                    <tbody>
                        {fila.ultimas_falhas.length === 0 && <tr><td colSpan={3}><Empty>Nenhuma falha registrada.</Empty></td></tr>}
                        {fila.ultimas_falhas.map((f) => <tr key={f.id}><td>{fmtDateTime(f.quando)}</td><td className={styles.mono}>{f.funcao}</td><td className={styles.mono}>{f.erro}</td></tr>)}
                    </tbody>
                </table>
            </div>
            <div className={styles.section_title}>Verificações de segurança e operação</div>
            <div className={styles.table_wrap}>
                <table className={styles.table}>
                    <thead><tr><th>Verificação</th><th>Estado</th><th>Detalhe</th></tr></thead>
                    <tbody>{verificacoes.map((v) => (
                        <tr key={v.nome}><td>{v.titulo}</td><td><StatusPill map={CHECK_STATUS} value={v.status} /></td><td>{v.detalhe}</td></tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );
}
