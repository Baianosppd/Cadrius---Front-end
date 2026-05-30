import styles from '../individual/Step.module.css';
import { FiCheckCircle } from 'react-icons/fi';

const StepConfirmacaoEmpresa = () => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.icon_wrapper} style={{ backgroundColor: '#dcfce7' }}>
                    <span style={{ fontSize: 24 }}>🎉</span>
                </div>
                <div>
                    <h2 className={styles.title}>Confirmação</h2>
                    <p className={styles.subtitle}>Sua empresa está pronta para começar!</p>
                </div>
            </div>

            <div className={styles.success_content}>
                <div className={styles.success_icon_wrapper}>
                    <span className={styles.success_emoji}>🎉</span>
                </div>
                <h2 className={styles.success_title}>Empresa Cadastrada com Sucesso!</h2>
                <p className={styles.success_subtitle}>Sua empresa está pronta para começar a usar o Cadrius. Acesse o painel para criar documentos, automatizar processos e gerenciar sua equipe.</p>

                <div className={styles.next_steps}>
                    <p className={styles.next_steps_title}>Próximos Passos:</p>
                    {[
                        'Configure suas integrações com outros sistemas',
                        'Convide membros da sua equipe',
                        'Crie seu primeiro documento automatizado',
                    ].map((step, i) => (
                        <div key={i} className={styles.next_step_item}>
                            <FiCheckCircle className={styles.next_step_icon} />
                            {step}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StepConfirmacaoEmpresa;