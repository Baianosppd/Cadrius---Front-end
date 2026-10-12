import styles from './RegisterFooter.module.css';
import { FiChevronLeft, FiChevronRight, FiX, FiCheckCircle } from 'react-icons/fi';
import { Button } from '../ui';

// Rodapé do cadastro em etapas: Anterior · Cancelar · Próximo (ou "Ir para o Painel" na última)
const RegisterFooter = ({ onPrev, onCancel, onNext, isFirst, isLast }) => (
    <div className={styles.footer}>
        <Button icon={FiChevronLeft} onClick={onPrev} disabled={isFirst}>Anterior</Button>
        <Button variant="ghost" icon={FiX} onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" onClick={onNext}>
            {isLast ? <>Ir para o Painel <FiCheckCircle aria-hidden="true" /></> : <>Próximo <FiChevronRight aria-hidden="true" /></>}
        </Button>
    </div>
);

export default RegisterFooter;
