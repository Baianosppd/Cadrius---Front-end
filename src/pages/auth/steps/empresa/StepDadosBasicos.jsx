import styles from '../individual/Step.module.css';
import { FiGrid } from 'react-icons/fi';
import { Field, Input, Select } from '../../../../components/ui';
import { maskCnpj } from '../../../../utils/format';

const tipos = ['Selecione o tipo...', 'Sociedade Limitada (LTDA)', 'Sociedade Anônima (S.A.)', 'EIRELI', 'MEI'];
const Obrigatorio = () => <span className={styles.required}>Obrigatório</span>;

const StepDadosBasicos = ({ formData, onChange }) => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.icon_wrapper}>
                    <FiGrid className={styles.icon} />
                </div>
                <div>
                    <h2 className={styles.title}>Dados Básicos</h2>
                    <p className={styles.subtitle}>Informações fundamentais de identificação</p>
                </div>
            </div>

            <div className={styles.fields_grid}>
                <Field label={<>Razão Social <Obrigatorio /></>}>
                    <Input size="lg" placeholder="Ex: Silva & Associados Ltda" value={formData.razaoSocial || ''} onChange={(e) => onChange({ razaoSocial: e.target.value })} />
                </Field>
                <Field label={<>Nome Fantasia <Obrigatorio /></>}>
                    <Input size="lg" placeholder="Ex: Silva Advocacia" value={formData.nomeFantasia || ''} onChange={(e) => onChange({ nomeFantasia: e.target.value })} />
                </Field>
                <Field label={<>CNPJ <Obrigatorio /></>}>
                    <Input size="lg" inputMode="numeric" placeholder="00.000.000/0001-00" value={formData.cnpj || ''} maxLength={18} onChange={(e) => onChange({ cnpj: maskCnpj(e.target.value) })} />
                </Field>
                <Field label="Tipo de Sociedade">
                    <Select size="lg" value={formData.tipoSociedade || ''} onChange={(e) => onChange({ tipoSociedade: e.target.value })}>
                        {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
                    </Select>
                </Field>
            </div>
        </div>
    );
};

export default StepDadosBasicos;
