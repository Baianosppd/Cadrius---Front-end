import styles from './Step.module.css';
import { FiUser } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

const StepDadosPessoais = ({ formData, onChange }) => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.icon_wrapper}>
                    <FiUser className={styles.icon} />
                </div>
                <div>
                    <h2 className={styles.title}>Dados Pessoais</h2>
                    <p className={styles.subtitle}>Crie sua conta para começar</p>
                </div>
            </div>

            <div className={styles.social_buttons}>
                <button className={styles.social_button}>
                    <FcGoogle className={styles.social_icon} />
                    Criar conta com Google
                </button>
                <button className={styles.social_button}>
                    <img src="/microsoft-icon.png" alt="Microsoft" className={styles.social_icon} />
                    Criar com Microsoft
                </button>
            </div>

            <div className={styles.divider}>
                <span className={styles.divider_line} />
                <span className={styles.divider_text}>ou preencha manualmente</span>
                <span className={styles.divider_line} />
            </div>

            <div className={styles.fields_grid}>
                <div className={styles.field}>
                    <label className={styles.label}>Nome Completo <span className={styles.required}>Obrigatório</span></label>
                    <input className={styles.input} placeholder="Maria Silva Santos" value={formData.nome || ''} onChange={e => onChange({ nome: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>CPF <span className={styles.required}>Obrigatório</span></label>
                    <input className={styles.input} placeholder="000.000.000-00" value={formData.cpf || ''} onChange={e => onChange({ cpf: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>E-mail <span className={styles.required}>Obrigatório</span></label>
                    <input className={styles.input} placeholder="maria@email.com" value={formData.email || ''} onChange={e => onChange({ email: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Criar Senha <span className={styles.required}>Obrigatório</span></label>
                    <input className={styles.input} type="password" placeholder="Mínimo 8 caracteres" value={formData.senha || ''} onChange={e => onChange({ senha: e.target.value })} />
                </div>
            </div>
        </div>
    );
};

export default StepDadosPessoais;