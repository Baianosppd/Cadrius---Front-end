import styles from '../../components/ui/ui.module.css';
import { PageHeader } from '../../components/ui';
import MarketingStudio from '../../components/marketing/MarketingStudio';
import { cadriusMarketingApi } from '../../services/marketing';

// Marketing da Cadrius (CAD-174): conteúdo para atrair escritórios, campanhas, indicadores de crescimento e playbook
export default function GestaoMarketing() {
    return (
        <div className={styles.page}>
            <PageHeader title="Marketing da Cadrius" subtitle="Campanhas para novos escritórios" />
            <MarketingStudio api={cadriusMarketingApi} scope="cadrius" canWrite canApprove />
        </div>
    );
}
