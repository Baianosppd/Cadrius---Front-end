import styles from './DocumentParties.module.css';
import { FiUsers } from 'react-icons/fi';

const PartyItem = ({ role, name, document }) => (
    <div className={styles.party_item}>
        <span className={styles.party_role}>{role}</span>
        <p className={styles.party_name}>{name}</p>
        <span className={styles.party_document}>{document}</span>
    </div>
);

const DocumentParties = ({ parties = [] }) => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.icon_wrapper}>
                    <FiUsers className={styles.icon} />
                </div>
                <h3 className={styles.title}>Partes</h3>
            </div>
            <div className={styles.parties_list}>
                {parties.map((party, index) => (
                    <PartyItem key={index} {...party} />
                ))}
            </div>
        </div>
    );
};

export default DocumentParties;