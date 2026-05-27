import styles from './DocumentSummary.module.css';
import { FiStar } from 'react-icons/fi';

const DocumentSummary = ({ summary }) => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.icon_wrapper}>
                    <FiStar className={styles.icon} />
                </div>
                <h3 className={styles.title}>Resumo</h3>
            </div>
            <p className={styles.text}>{summary}</p>
        </div>
    );
};

export default DocumentSummary;