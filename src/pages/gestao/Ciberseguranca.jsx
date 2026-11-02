import { useEffect, useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import styles from '../../components/ui/ui.module.css';
import { Banner, Button, Checkbox, Empty, PageHeader, Row, Tabs } from '../../components/ui';
import { fmtDateTime } from '../../utils/format';
import { Resumo, VisaoGeral } from '../../components/cyber/Visao';
import Servidor from '../../components/cyber/Servidor';
import Ameacas from '../../components/cyber/Ameacas';
import Alertas from '../../components/cyber/Alertas';
import Acessos from '../../components/cyber/Acessos';
import Configuracao from '../../components/cyber/Configuracao';
import IaProvedores from '../../components/cyber/IaProvedores';
import IpsBloqueados from '../../components/cyber/IpsBloqueados';
import { backofficeApi } from '../../services/backoffice';
import useLoader from '../../hooks/useLoader';

const REFRESH_S = 30;

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

    const tabs = [
        { id: 'geral', label: 'Visão geral' }, { id: 'servidor', label: 'Servidor' }, { id: 'ameacas', label: 'Ameaças' },
        { id: 'alertas', label: 'Alertas', count: data?.alertas?.abertos || undefined }, { id: 'acessos', label: 'Acessos' },
        { id: 'configuracao', label: 'Configuração' }, { id: 'ia', label: 'IA' }, { id: 'ips', label: 'IPs bloqueados' },
    ];

    return (
        <div className={styles.page}>
            <PageHeader title="Cibersegurança" subtitle="Sistema e servidor em tempo real"
                actions={(
                    <Row gap={3}>
                        <Checkbox checked={auto} onChange={(e) => setAuto(e.target.checked)}>Atualizar a cada {REFRESH_S} s</Checkbox>
                        <Button icon={FiRefreshCw} loading={loading} loadingLabel="Atualizando…" onClick={reload}>Atualizar</Button>
                    </Row>
                )} />
            {error && <Banner tone="error">{error}</Banner>}
            {!data && !error && <Empty>Coletando métricas…</Empty>}
            {data && (
                <>
                    <Resumo data={data} onGo={setTab} />
                    <Tabs tabs={tabs} value={tab} onChange={setTab} />
                    {tab === 'geral' && <VisaoGeral data={data} />}
                    {tab === 'servidor' && <Servidor data={data} />}
                    {tab === 'ameacas' && <Ameacas data={data} reload={reload} />}
                    {tab === 'alertas' && <Alertas data={data} reload={reload} />}
                    {tab === 'acessos' && <Acessos a={data.acessos} chain={data.trilha} />}
                    {tab === 'configuracao' && <Configuracao c={data.configuracao} />}
                    {tab === 'ia' && <IaProvedores ai={data.ia} />}
                    {tab === 'ips' && <IpsBloqueados rows={data.ips_bloqueados} reload={reload} />}
                    <div className={styles.muted}>Atualizado em {fmtDateTime(data.gerado_em)}. E-mails aparecem mascarados; nenhum segredo é exibido.</div>
                </>
            )}
        </div>
    );
}
