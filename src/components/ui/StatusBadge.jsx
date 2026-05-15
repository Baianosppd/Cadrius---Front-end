import styles from './StatusBadge.module.css';

function StatusBadge({ status, text, small = false }) {

    const isError = status === 'FAILED' || status === 'ERROR';

    const statusClass = isError
        ? styles.failed
        : styles.active;

    const sizeClass = small
        ? styles.small
        : '';

    return (
        <span className={`${styles.badge} ${statusClass} ${sizeClass}`}>
            {text}
        </span>
    );
}

export default StatusBadge;
