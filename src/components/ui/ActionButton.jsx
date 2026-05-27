import styles from './ActionButton.module.css';

const ActionButton = ({ icon: Icon, label, onClick, variant = 'primary' }) => {
    return (
        <button
            className={`${styles.button} ${styles[variant]}`}
            onClick={onClick}
        >
            {Icon && <Icon className={styles.icon} />}
            {label}
        </button>
    );
};

export default ActionButton;