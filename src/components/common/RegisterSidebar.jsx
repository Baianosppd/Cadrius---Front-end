import styles from './RegisterSidebar.module.css';
import { FiCheck } from 'react-icons/fi';

const RegisterSidebar = ({ title, subtitle, icon: Icon, steps, currentStep, tip }) => {
    const progress = Math.round((currentStep / steps.length) * 100);

    return (
        <div className={styles.sidebar}>
            <div className={styles.top}>
                <div className={styles.header}>
                    {Icon && (
                        <div className={styles.icon_wrapper}>
                            <Icon className={styles.icon} />
                        </div>
                    )}
                    <div>
                        <p className={styles.title}>{title}</p>
                        <p className={styles.subtitle}>{subtitle}</p>
                    </div>
                </div>

                <div className={styles.progress_section}>
                    <div className={styles.progress_header}>
                        <span className={styles.progress_label}>Progresso geral</span>
                        <span className={styles.progress_percent}>{progress}%</span>
                    </div>
                    <div className={styles.progress_bar}>
                        <div className={styles.progress_fill} style={{ width: `${progress}%` }} />
                    </div>
                </div>

                <div className={styles.steps}>
                    {steps.map((step, index) => {
                        const stepNumber = index + 1;
                        const isDone = stepNumber < currentStep;
                        const isActive = stepNumber === currentStep;

                        return (
                            <div
                                key={index}
                                className={`${styles.step} ${isActive ? styles.step_active : ''} ${isDone ? styles.step_done : ''}`}
                            >
                                <div className={`${styles.step_number} ${isActive ? styles.number_active : ''} ${isDone ? styles.number_done : ''}`}>
                                    {isDone ? <FiCheck className={styles.check_icon} /> : stepNumber}
                                </div>
                                <div className={styles.step_text}>
                                    <p className={styles.step_label}>{step.label}</p>
                                    <span className={styles.step_sublabel}>{step.sublabel}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {tip && (
                <div className={styles.tip}>
                    <span className={styles.tip_icon}>💡</span>
                    <div>
                        <p className={styles.tip_title}>Dica</p>
                        <p className={styles.tip_text}>{tip}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegisterSidebar;