import styles from './SyncHistory.module.css';

const SyncItem = ({ name, description, time, status }) => (
    <div className={styles.item}>
        <div className={styles.item_left}>
            <span className={`${styles.dot} ${status === 'erro' ? styles.dot_error : styles.dot_success}`} />
            <div className={styles.item_content}>
                <p className={styles.item_name}>{name}</p>
                <p className={`${styles.item_description} ${status === 'erro' ? styles.description_error : ''}`}>
                    {description}
                </p>
            </div>
        </div>
        <span className={styles.item_time}>{time}</span>
    </div>
);

const SyncHistory = ({ history = [] }) => {
    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Histórico de Sincronização</h2>
            <div className={styles.list}>
                {history.map((item, index) => (
                    <SyncItem key={index} {...item} />
                ))}
            </div>
        </div>
    );
};

export default SyncHistory;