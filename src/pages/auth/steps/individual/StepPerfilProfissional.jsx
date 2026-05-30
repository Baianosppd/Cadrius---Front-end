import styles from './Step.module.css';
import { FiBriefcase } from 'react-icons/fi';

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
                <div className={styles.field}>
                    <label className={styles.label}>Número da OAB <span className={styles.optional}>Opcional</span></label>
                    <input className={styles.input} placeholder="Ex: 123456" value={formData.oab || ''} onChange={e => onChange({ oab: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Estado (UF)</label>
                    <select className={styles.select} value={formData.uf || ''} onChange={e => onChange({ uf: e.target.value })}>
                        <option value="">UF</option>
                        {estados.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                </div>
                <div className={`${styles.field} ${styles.field_full}`}>
                    <label className={styles.label}>Área de Atuação Principal</label>
                    <select className={styles.select} value={formData.area || ''} onChange={e => onChange({ area: e.target.value })}>
                        <option value="">Selecione a área...</option>
                        <option>Direito Civil</option>
                        <option>Direito Penal</option>
                        <option>Direito Trabalhista</option>
                        <option>Direito Tributário</option>
                        <option>Direito Empresarial</option>
                        <option>Direito de Família</option>
                        <option>Direito Previdenciário</option>
                        <option>Outra</option>
                    </select>
                </div>
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