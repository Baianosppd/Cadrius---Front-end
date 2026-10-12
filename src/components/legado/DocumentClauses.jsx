import styles from './DocumentClauses.module.css';
import { FiAlertTriangle } from 'react-icons/fi';

const priorityConfig = {
    Alta: { bg: 'var(--c-danger-bg)', color: 'var(--c-danger)' },
    Média: { bg: 'var(--c-warning-bg)', color: 'var(--c-warning)' },
    Baixa: { bg: 'var(--c-success-bg)', color: 'var(--c-success)' },
};

const ClauseItem = ({ title, description, priority }) => {
    const { bg, color } = priorityConfig[priority] || priorityConfig['Média'];
    return (
        <div className={styles.clause_item}>
            <div className={styles.clause_bar} />
            <div className={styles.clause_content}>
                <div className={styles.clause_header}>
                    <span className={styles.clause_title}>{title}</span>
                    <span className={styles.priority_badge} style={{ backgroundColor: bg, color }}>
                        {priority}
                    </span>
                </div>
                <p className={styles.clause_description}>{description}</p>
            </div>
        </div>
    );
};

const DocumentClauses = ({ clauses = [] }) => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.icon_wrapper}>
                    <FiAlertTriangle className={styles.icon} />
                </div>
                <h3 className={styles.title}>Cláusulas Críticas</h3>
            </div>
            <div className={styles.clauses_list}>
                {clauses.map((clause, index) => (
                    <ClauseItem key={index} {...clause} />
                ))}
            </div>
        </div>
    );
};

export default DocumentClauses;