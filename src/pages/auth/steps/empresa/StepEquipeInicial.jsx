import styles from '../individual/Step.module.css';
import empStyles from './StepEmpresa.module.css';
import { FiUsers, FiUserPlus } from 'react-icons/fi';

const StepEquipeInicial = ({ formData, onChange }) => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.icon_wrapper}>
                    <FiUsers className={styles.icon} />
                </div>
                <div>
                    <h2 className={styles.title}>Equipe Inicial</h2>
                    <p className={styles.subtitle}>Adicione membros da sua equipe</p>
                </div>
            </div>

            <div className={empStyles.empty_team}>
                <FiUsers className={empStyles.empty_icon} />
                <h3 className={empStyles.empty_title}>Adicione sua Equipe</h3>
                <p className={empStyles.empty_subtitle}>Você pode fazer isso agora ou depois. Convide funcionários para colaborar no escritório.</p>
                <button className={empStyles.invite_button}>
                    <FiUserPlus className={empStyles.invite_icon} />
                    Convidar Funcionário
                </button>
            </div>
        </div>
    );
};

export default StepEquipeInicial;