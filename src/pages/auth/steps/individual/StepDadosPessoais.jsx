import styles from './Step.module.css';
import { FiUser } from 'react-icons/fi';
import LegalAcceptance from '../../../../components/common/LegalAcceptance';

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
                    <input className={styles.input} type="email" autoComplete="email" placeholder="maria@email.com" value={formData.email || ''} onChange={e => onChange({ email: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Criar Senha <span className={styles.required}>Obrigatório</span></label>
                    <input className={styles.input} type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" value={formData.senha || ''} onChange={e => onChange({ senha: e.target.value })} />
                </div>
            </div>

            <LegalAcceptance formData={formData} onChange={onChange} />
        </div>
    );
};

export default StepDadosPessoais;