import styles from './DocumentDeadlines.module.css';
import { FiClock } from 'react-icons/fi';

const deadlineColor = (days) => {
    if (days <= 15) return { bg: 'var(--c-danger-bg)', color: 'var(--c-danger)' };
    if (days <= 30) return { bg: 'var(--c-warning-bg)', color: '#ca8a04' };
    return { bg: 'var(--c-success-bg)', color: 'var(--c-success)' };
};

const DeadlineItem = ({ label, days }) => {
    const { bg, color } = deadlineColor(days);
    return (
        <div className={styles.deadline_item}>
            <span className={styles.deadline_label}>{label}</span>
            <span className={styles.deadline_badge} style={{ backgroundColor: bg, color }}>
                {days} dias
            </span>
        </div>
    );
};

const DocumentDeadlines = ({ deadlines = [] }) => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.icon_wrapper}>
                    <FiClock className={styles.icon} />
                </div>
                <h3 className={styles.title}>Prazos Extraídos</h3>
            </div>
            <div className={styles.deadlines_list}>
                {deadlines.map((deadline, index) => (
                    <DeadlineItem key={index} {...deadline} />
                ))}
            </div>
        </div>
    );
};

export default DocumentDeadlines;