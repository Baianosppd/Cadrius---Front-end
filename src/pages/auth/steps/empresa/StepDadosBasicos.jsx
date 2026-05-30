import styles from '../individual/Step.module.css';
import { FiGrid } from 'react-icons/fi';
import { useState } from 'react';

const tipos = ['Selecione o tipo...', 'Sociedade Limitada (LTDA)', 'Sociedade Anônima (S.A.)', 'EIRELI', 'MEI'];

const StepDadosBasicos = ({ formData, onChange }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);

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
                <div className={styles.field}>
                    <label className={styles.label}>Razão Social <span className={styles.required}>Obrigatório</span></label>
                    <input className={styles.input} placeholder="Ex: Silva & Associados Ltda" value={formData.razaoSocial || ''} onChange={e => onChange({ razaoSocial: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Nome Fantasia <span className={styles.required}>Obrigatório</span></label>
                    <input className={styles.input} placeholder="Ex: Silva Advocacia" value={formData.nomeFantasia || ''} onChange={e => onChange({ nomeFantasia: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>CNPJ <span className={styles.required}>Obrigatório</span></label>
                    <input className={styles.input} placeholder="00.000.000/0001-00" value={formData.cnpj || ''} onChange={e => onChange({ cnpj: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Tipo de Sociedade</label>
                    <select className={styles.select} value={formData.tipoSociedade || ''} onChange={e => onChange({ tipoSociedade: e.target.value })}>
                        {tipos.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default StepDadosBasicos;