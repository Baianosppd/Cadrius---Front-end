import LegalAcceptance from '../../../../components/auth/LegalAcceptance';
import styles from '../individual/Step.module.css';
import { FiUser } from 'react-icons/fi';
import { Field, Input } from '../../../../components/ui';

const Obrigatorio = () => <span className={styles.required}>Obrigatório</span>;

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

            <div className={styles.fields_grid}>
                <Field label={<>Nome Completo <Obrigatorio /></>}>
                    <Input size="lg" autoComplete="name" placeholder="João Silva Santos" value={formData.gerenteNome || ''} onChange={(e) => onChange({ gerenteNome: e.target.value })} />
                </Field>
                <Field label={<>CPF <Obrigatorio /></>}>
                    <Input size="lg" inputMode="numeric" placeholder="000.000.000-00" value={formData.gerenteCpf || ''} onChange={(e) => onChange({ gerenteCpf: e.target.value })} />
                </Field>
                <Field label={<>E-mail de Acesso <Obrigatorio /></>} hint="Este e-mail será usado para login no sistema.">
                    <Input size="lg" type="email" autoComplete="email" placeholder="joao@empresa.com" value={formData.gerenteEmail || ''} onChange={(e) => onChange({ gerenteEmail: e.target.value })} />
                </Field>
                <Field label={<>Criar Senha <Obrigatorio /></>}>
                    <Input size="lg" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" value={formData.gerenteSenha || ''} onChange={(e) => onChange({ gerenteSenha: e.target.value })} />
                </Field>
                <Field label="Cargo" className={styles.field_full}>
                    <Input size="lg" placeholder="Ex: Gerente Jurídico" value={formData.gerenteCargo || ''} onChange={(e) => onChange({ gerenteCargo: e.target.value })} />
                </Field>
            </div>

            <LegalAcceptance formData={formData} onChange={onChange} />
        </div>
    );
};

export default StepGerenteResponsavel;
