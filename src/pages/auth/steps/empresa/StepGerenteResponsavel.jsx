import styles from '../individual/Step.module.css';
import { FiUser } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

const StepGerenteResponsavel = ({ formData, onChange }) => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.icon_wrapper}>
                    <FiUser className={styles.icon} />
                </div>
                <div>
                    <h2 className={styles.title}>Gerente Responsável</h2>
                    <p className={styles.subtitle}>Cadastre o responsável pelo escritório</p>
                </div>
            </div>

            <div className={styles.social_buttons}>
                <button className={styles.social_button}>
                    <FcGoogle className={styles.social_icon} />
                    Importar dados com Google
                </button>
                <button className={styles.social_button}>
                    <img src="/microsoft-icon.png" alt="Microsoft" className={styles.social_icon} />
                    Importar com Microsoft
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
                    <input className={styles.input} placeholder="João Silva Santos" value={formData.gerenteNome || ''} onChange={e => onChange({ gerenteNome: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>CPF <span className={styles.required}>Obrigatório</span></label>
                    <input className={styles.input} placeholder="000.000.000-00" value={formData.gerenteCpf || ''} onChange={e => onChange({ gerenteCpf: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>E-mail de Acesso <span className={styles.required}>Obrigatório</span></label>
                    <input className={styles.input} placeholder="joao@empresa.com" value={formData.gerenteEmail || ''} onChange={e => onChange({ gerenteEmail: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Criar Senha <span className={styles.required}>Obrigatório</span></label>
                    <input className={styles.input} type="password" placeholder="Mínimo 8 caracteres" value={formData.gerenteSenha || ''} onChange={e => onChange({ gerenteSenha: e.target.value })} />
                </div>
                <div className={`${styles.field} ${styles.field_full}`}>
                    <label className={styles.label}>Cargo</label>
                    <input className={styles.input} placeholder="Ex: Gerente Jurídico" value={formData.gerenteCargo || ''} onChange={e => onChange({ gerenteCargo: e.target.value })} />
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>Este e-mail será usado para login no sistema</span>
                </div>
            </div>
        </div>
    );
};

export default StepGerenteResponsavel;