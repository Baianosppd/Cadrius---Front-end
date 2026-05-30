import styles from './RegisterFooter.module.css';
import { FiChevronLeft, FiChevronRight, FiX, FiCheckCircle } from 'react-icons/fi';

const RegisterFooter = ({ onPrev, onCancel, onNext, isFirst, isLast }) => {
    return (
        <div className={styles.footer}>
            <button className={styles.prev_button} onClick={onPrev} disabled={isFirst}>
                <FiChevronLeft className={styles.icon} />
                Anterior
            </button>
            <button className={styles.cancel_button} onClick={onCancel}>
                <FiX className={styles.icon} />
                Cancelar
            </button>
            <button className={styles.next_button} onClick={onNext}>
                {isLast ? (
                    <>Ir para o Painel <FiCheckCircle className={styles.icon} /></>
                ) : (
                    <>Próximo <FiChevronRight className={styles.icon} /></>
                )}
            </button>
        </div>
    );
};

export default RegisterFooter;