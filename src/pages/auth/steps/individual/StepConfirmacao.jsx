import styles from './Step.module.css';
import { FiCheckCircle } from 'react-icons/fi';

const StepConfirmacao = () => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.icon_wrapper} style={{ backgroundColor: '#dcfce7' }}>
                    <span style={{ fontSize: 24 }}>🎉</span>
                </div>
                <div>
                    <h2 className={styles.title}>Confirmação</h2>
                    <p className={styles.subtitle}>Sua conta está pronta para uso!</p>
                </div>
            </div>

            <div className={styles.success_content}>
                <div className={styles.success_icon_wrapper}>
                    <span className={styles.success_emoji}>🎉</span>
                </div>
                <h2 className={styles.success_title}>Bem-vindo ao Cadrius!</h2>
                <p className={styles.success_subtitle}>Sua conta foi criada com sucesso. Você já pode começar a criar documentos jurídicos inteligentes e automatizar seus processos.</p>

                <div className={styles.next_steps}>
                    <p className={styles.next_steps_title}>Próximos Passos:</p>
                    {[
                        'Complete seu perfil profissional',
                        'Explore os templates disponíveis',
                        'Crie seu primeiro documento',
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

export default StepConfirmacao;