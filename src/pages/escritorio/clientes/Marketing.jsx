import { useState } from 'react';
import styles from '../../../components/ui/ui.module.css';
import { PageHeader, Tabs } from '../../../components/ui';
import MarketingStudio from '../../../components/marketing/MarketingStudio';
import { Captacao, Resultados } from '../../../components/marketing/Captacao';
import useAuth from '../../../hooks/useAuth';
import { officeMarketingApi } from '../../../services/marketing';

const TABS = [{ id: 'conteudo', label: 'Conteúdo' }, { id: 'captacao', label: 'Captação' }, { id: 'resultados', label: 'Resultados e satisfação' }];

// Marketing do escritório (CAD-174): conteúdo informativo dentro do Provimento 205/2021 da OAB.
// CAD-223: formulários de captação (com LGPD) e resultados por origem/campanha + NPS.
export default function Marketing() {
    const { role, isOrgManager, access } = useAuth();
    const perms = access?.permissoes;
    const canWrite = perms ? perms.includes('marketing.editar') : role !== 'VIEWER';
    const canApprove = isOrgManager || !!perms?.includes('marketing.aprovar');
    const [tab, setTab] = useState('conteudo');
    return (
        <div className={styles.page}>
            <PageHeader title="Marketing" subtitle="Conteúdo, captação e resultados" />
            <Tabs tabs={TABS} value={tab} onChange={setTab} />
            {tab === 'conteudo' && <MarketingStudio api={officeMarketingApi} scope="escritorio" canWrite={canWrite} canApprove={canApprove} />}
            {tab === 'captacao' && <Captacao canWrite={canWrite} />}
            {tab === 'resultados' && <Resultados />}
        </div>
    );
}
