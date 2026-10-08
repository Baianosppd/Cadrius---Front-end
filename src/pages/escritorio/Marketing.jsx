import { useState } from 'react';
import styles from '../../components/seguranca/seguranca.module.css';
import { PageHeader } from '../../components/seguranca/ui';
import InfoHint from '../../components/common/InfoHint';
import MarketingStudio from '../../components/marketing/MarketingStudio';
import { Captacao, Resultados } from '../../components/marketing/Captacao';
import useAuth from '../../hooks/useAuth';
import { officeMarketingApi } from '../../services/marketing';

const TABS = [['conteudo', 'Conteúdo'], ['captacao', 'Captação'], ['resultados', 'Resultados e satisfação']];

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
            <PageHeader title="Marketing" subtitle="Conteúdo e captação dentro das regras da OAB" />
            <div className={styles.tabs} role="tablist">
                {TABS.map(([k, label]) => (
                    <button key={k} type="button" role="tab" aria-selected={tab === k} className={`${styles.tab} ${tab === k ? styles.tab_active : ''}`} onClick={() => setTab(k)}>{label}</button>
                ))}
            </div>
            {tab === 'conteudo' && (
                <>
                    <InfoHint summary="O que a OAB permite (Provimento 205/2021)">
                        O Provimento 205/2021 permite marketing jurídico informativo e sóbrio — sem preço, promessa de resultado ou chamada para contratar.
                        O verificador aponta riscos, mas a decisão final é sua. Só quem tem permissão de aprovar publica.
                    </InfoHint>
                    <MarketingStudio api={officeMarketingApi} scope="escritorio" canWrite={canWrite} canApprove={canApprove} />
                </>
            )}
            {tab === 'captacao' && <Captacao canWrite={canWrite} />}
            {tab === 'resultados' && <Resultados />}
        </div>
    );
}
