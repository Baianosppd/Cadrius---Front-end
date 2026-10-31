import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../../components/ui/ui.module.css';
import { FiRefreshCw } from 'react-icons/fi';
import { Banner, Button, CHECK_STATUS, Empty, Field, Input, Loading, PageHeader, Pill, Row, Stack, StatCard, StatusPill, Table } from '../../components/ui';
import { errorMessage, fmtDateTime } from '../../utils/format';
import { CONFIG_LABEL, MIN_REASON, backofficeApi } from '../../services/backoffice';
import useLoader from '../../hooks/useLoader';

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
        <Stack gap={2} className={styles.card}>
            <div className={`${styles.section_title} ${styles.mb_0}`}>IA da plataforma (kill switch global)</div>
            <div>{ia.ligada ? <Pill tone="green">Ligada</Pill> : <Pill tone="red">Desligada</Pill>}
                {' '}<span className={styles.muted}>{ia.motivo && `Motivo: ${ia.motivo} · `}alterado em {fmtDateTime(ia.alterado_em)}</span></div>
            {ia.ligada && (
                <Field label="Motivo para desligar" hint={`Incidente, provedor fora, vazamento suspeito… Mínimo de ${MIN_REASON} caracteres.`}>
                    <Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={255} />
                </Field>
            )}
            <Button className={styles.w_fit} variant={ia.ligada ? 'danger' : 'primary'} loading={busy} onClick={toggle}>
                {ia.ligada ? 'Desligar a IA de todos os escritórios' : 'Religar a IA'}
            </Button>
        </Stack>
    );
}

export default function Sistema() {
    const { data, error, reload, loading } = useLoader(backofficeApi.health);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    const { servicos: s, fila, config, ia_global: ia, verificacoes } = data;
    const failing = verificacoes.filter((v) => v.status === 'fail');
    return (
        <div className={styles.page}>
            <PageHeader title="Sistema e operação" subtitle={`Versão ${config.versao}${config.debug ? ' · DEBUG LIGADO' : ''}`}
                actions={<Button icon={FiRefreshCw} onClick={reload} loading={loading}>Atualizar</Button>} />
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
                <Row gap={1}>
                    {Object.entries(CONFIG_LABEL).map(([k, label]) => <Pill key={k} tone={config[k] ? 'green' : 'gray'}>{label}: {config[k] ? 'sim' : 'não'}</Pill>)}
                    <Pill tone={config.noticias_fontes ? 'green' : 'gray'}>Fontes de notícias: {config.noticias_fontes}</Pill>
                    {config.email_provedor && <Pill tone="blue">E-mail via {config.email_provedor}</Pill>}
                </Row>
            </div>
            <div className={styles.section_title}>Rotinas agendadas</div>
            <Table columns={['Rotina', 'Comando', 'Próxima execução']}
                empty={fila.rotinas.length === 0 && <Empty>Nenhuma rotina agendada. Rode: python manage.py setup_security_schedules</Empty>}>
                {fila.rotinas.map((r) => (
                    <tr key={r.nome}><td>{r.nome}</td><td data-label="Comando" className={styles.mono}>{r.comando}</td>
                        <td data-label="Próxima execução">{fmtDateTime(r.proxima)}</td></tr>
                ))}
            </Table>
            <div className={styles.section_title}>Últimas falhas da fila</div>
            <Table columns={['Quando', 'Tarefa', 'Erro (dados pessoais mascarados)']}
                empty={fila.ultimas_falhas.length === 0 && <Empty>Nenhuma falha registrada.</Empty>}>
                {fila.ultimas_falhas.map((f) => (
                    <tr key={f.id}><td>{fmtDateTime(f.quando)}</td><td data-label="Tarefa" className={styles.mono}>{f.funcao}</td>
                        <td data-label="Erro" className={`${styles.mono} ${styles.break_all}`}>{f.erro}</td></tr>
                ))}
            </Table>
            <div className={styles.section_title}>Verificações de segurança e operação</div>
            <Table columns={['Verificação', 'Estado', 'Detalhe']}>
                {verificacoes.map((v) => (
                    <tr key={v.nome}><td>{v.titulo}</td><td data-label="Estado"><StatusPill map={CHECK_STATUS} value={v.status} /></td>
                        <td data-label="Detalhe">{v.detalhe}</td></tr>
                ))}
            </Table>
        </div>
    );
}
