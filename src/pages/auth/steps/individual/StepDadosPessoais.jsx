import styles from './Step.module.css';
import { FiUser } from 'react-icons/fi';
import { Field, Input } from '../../../../components/ui';
import LegalAcceptance from '../../../../components/auth/LegalAcceptance';
import { maskCpf } from '../../../../utils/format';

const Obrigatorio = () => <span className={styles.required}>Obrigatório</span>;

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
                <Field label={<>Nome Completo <Obrigatorio /></>}>
                    <Input size="lg" autoComplete="name" placeholder="Maria Silva Santos" value={formData.nome || ''} onChange={(e) => onChange({ nome: e.target.value })} />
                </Field>
                <Field label={<>CPF <Obrigatorio /></>}>
                    <Input size="lg" inputMode="numeric" placeholder="000.000.000-00" value={formData.cpf || ''} maxLength={14} onChange={(e) => onChange({ cpf: maskCpf(e.target.value) })} />
                </Field>
                <Field label={<>E-mail <Obrigatorio /></>}>
                    <Input size="lg" type="email" autoComplete="email" placeholder="maria@email.com" value={formData.email || ''} onChange={(e) => onChange({ email: e.target.value })} />
                </Field>
                <Field label={<>Criar Senha <Obrigatorio /></>}>
                    <Input size="lg" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" value={formData.senha || ''} onChange={(e) => onChange({ senha: e.target.value })} />
                </Field>
            </div>

            <LegalAcceptance formData={formData} onChange={onChange} />
        </div>
    );
};

export default StepDadosPessoais;
