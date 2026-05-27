import styles from './IntegrationCard.module.css';
import { FiSettings, FiCheckCircle } from 'react-icons/fi';

const IntegrationCard = ({ name, status, description, syncInfo, onAction, logo: Logo, logoColor, logoBg }) => {
    const isConnected = status === 'conectado';

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.logo_wrapper} style={{ backgroundColor: logoBg || '#f3f4f6' }}>
                    {typeof Logo === 'string' && Logo.length === 1 ? (
    <span className={styles.logo_letter}>{Logo}</span>
) : typeof Logo === 'string' ? (
    <img src={Logo} alt={name} className={styles.logo_img} />
) : (
    <Logo className={styles.logo_icon} style={{ color: logoColor || '#374151' }} />
)}
                </div>
                <div>
                    <h3 className={styles.name}>{name}</h3>
                    <span className={`${styles.status} ${isConnected ? styles.status_connected : styles.status_disconnected}`}>
                        {isConnected && <FiCheckCircle className={styles.status_icon} />}
                        {isConnected ? 'Conectado' : 'Desconectado'}
                    </span>
                </div>
            </div>

            <p className={styles.description}>{description}</p>

            {syncInfo && <p className={styles.sync_info}>{syncInfo}</p>}

            <button className={styles.action_button} onClick={onAction}>
                <FiSettings className={styles.action_icon} />
                {isConnected ? 'Configurar' : 'Conectar'}
            </button>
        </div>
    );
};

export default IntegrationCard;