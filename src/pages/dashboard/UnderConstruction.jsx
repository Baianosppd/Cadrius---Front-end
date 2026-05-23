import styles from './UnderConstruction.module.css';
import { FiTool } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import ActionButton from '../../components/ui/ActionButton';
import { FiArrowLeft } from 'react-icons/fi';

function UnderConstruction() {
    const navigate = useNavigate();

    return (
        <div className={styles.container}>
            <div className={styles.icon_wrapper}>
                <FiTool className={styles.icon} />
            </div>
            <h1 className={styles.title}>Página em Construção</h1>
            <p className={styles.subtitle}>
                Esta funcionalidade ainda não está disponível ou está passando por melhorias. Volte em breve!
            </p>
            <div className={styles.button_wrapper}>
                <ActionButton
                    icon={FiArrowLeft}
                    label="Voltar para o Dashboard"
                    variant="secondary"
                    onClick={() => navigate('/dashboard')}
                />
            </div>
        </div>
    );
}

export default UnderConstruction;