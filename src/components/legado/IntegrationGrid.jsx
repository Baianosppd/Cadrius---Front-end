import styles from './IntegrationGrid.module.css';
import IntegrationCard from '../integracoes/IntegrationCard';

const IntegrationGrid = ({ integrations = [] }) => {
    return (
        <div className={styles.grid}>
            {integrations.map((integration, index) => (
                <IntegrationCard key={index} {...integration} onAction={integration.onAction || (() => {})} />
            ))}
        </div>
    );
};

export default IntegrationGrid;