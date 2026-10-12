import styles from './Step.module.css';
import { FiBriefcase } from 'react-icons/fi';
import { Field, Input, Select } from '../../../../components/ui';

const estados = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const StepPerfilProfissional = ({ formData, onChange }) => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.icon_wrapper}>
                    <FiBriefcase className={styles.icon} />
                </div>
                <div>
                    <h2 className={styles.title}>Perfil Profissional</h2>
                    <p className={styles.subtitle}>Informações sobre sua atuação profissional</p>
                </div>
            </div>

            <div className={styles.fields_grid}>
                <Field label={<>Número da OAB <span className={styles.optional}>Opcional</span></>}>
                    <Input size="lg" inputMode="numeric" placeholder="Ex: 123456" value={formData.oab || ''} onChange={(e) => onChange({ oab: e.target.value })} />
                </Field>
                <Field label="Estado (UF)">
                    <Select size="lg" value={formData.uf || ''} onChange={(e) => onChange({ uf: e.target.value })}>
                        <option value="">UF</option>
                        {estados.map((e) => <option key={e} value={e}>{e}</option>)}
                    </Select>
                </Field>
                <Field label="Área de Atuação Principal" className={styles.field_full}>
                    <Select size="lg" value={formData.area || ''} onChange={(e) => onChange({ area: e.target.value })}>
                        <option value="">Selecione a área...</option>
                        <option>Direito Civil</option>
                        <option>Direito Penal</option>
                        <option>Direito Trabalhista</option>
                        <option>Direito Tributário</option>
                        <option>Direito Empresarial</option>
                        <option>Direito de Família</option>
                        <option>Direito Previdenciário</option>
                        <option>Outra</option>
                    </Select>
                </Field>
            </div>

            <div className={styles.info_box}>
                <p className={styles.info_text}>
                    <strong>Por que pedimos isso?</strong> Essas informações nos ajudam a personalizar sua experiência e sugerir modelos de documentos relevantes para sua área de atuação.
                </p>
            </div>
        </div>
    );
};

export default StepPerfilProfissional;
