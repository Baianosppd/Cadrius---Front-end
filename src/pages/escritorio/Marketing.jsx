import styles from '../../components/seguranca/seguranca.module.css';
import { Banner, PageHeader } from '../../components/seguranca/ui';
import MarketingStudio from '../../components/marketing/MarketingStudio';
import useAuth from '../../hooks/useAuth';
import { officeMarketingApi } from '../../services/marketing';

// Marketing do escritório (CAD-174): conteúdo informativo dentro do Provimento 205/2021 da OAB
export default function Marketing() {
    const { role, isOrgManager } = useAuth();
    return (
        <div className={styles.page}>
            <PageHeader title="Marketing" subtitle="Conteúdo informativo para redes, blog e Google, com verificação das regras da OAB" />
            <Banner tone="info">
                O Provimento 205/2021 permite marketing jurídico informativo e sóbrio — sem preço, promessa de resultado ou chamada para contratar.
                O verificador aponta riscos, mas a decisão final é sua. Só dono ou administrador aprova e publica.
            </Banner>
            <MarketingStudio api={officeMarketingApi} scope="escritorio" canWrite={role !== 'VIEWER'} canApprove={isOrgManager} />
        </div>
    );
}
