import styles from '../../components/seguranca/seguranca.module.css';
import { PageHeader } from '../../components/seguranca/ui';
import MarketingStudio from '../../components/marketing/MarketingStudio';
import { cadriusMarketingApi } from '../../services/marketing';

// Marketing da Cadrius (CAD-174): conteúdo para atrair escritórios, campanhas, indicadores de crescimento e playbook
export default function GestaoMarketing() {
    return (
        <div className={styles.page}>
            <PageHeader title="Marketing da Cadrius" subtitle="Conteúdo, campanhas e indicadores para trazer novos escritórios" />
            <MarketingStudio api={cadriusMarketingApi} scope="cadrius" canWrite canApprove />
        </div>
    );
}
