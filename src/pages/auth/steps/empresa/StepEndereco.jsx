import styles from '../individual/Step.module.css';
import { FiMapPin } from 'react-icons/fi';

const estados = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const StepEndereco = ({ formData, onChange }) => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.icon_wrapper}>
                    <FiMapPin className={styles.icon} />
                </div>
                <div>
                    <h2 className={styles.title}>Endereço</h2>
                    <p className={styles.subtitle}>Informe a localização e canais de contato</p>
                </div>
            </div>

            <div className={styles.fields_grid}>
                <div className={styles.field}>
                    <label className={styles.label}>CEP</label>
                    <input className={styles.input} placeholder="00000-000" value={formData.cep || ''} onChange={e => onChange({ cep: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Logradouro</label>
                    <input className={styles.input} placeholder="Rua, Avenida, etc." value={formData.logradouro || ''} onChange={e => onChange({ logradouro: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Número</label>
                    <input className={styles.input} placeholder="123" value={formData.numero || ''} onChange={e => onChange({ numero: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Bairro</label>
                    <input className={styles.input} placeholder="Centro" value={formData.bairro || ''} onChange={e => onChange({ bairro: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Cidade</label>
                    <input className={styles.input} placeholder="São Paulo" value={formData.cidade || ''} onChange={e => onChange({ cidade: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>UF</label>
                    <select className={styles.select} value={formData.uf || ''} onChange={e => onChange({ uf: e.target.value })}>
                        <option value="">UF</option>
                        {estados.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Telefone Principal</label>
                    <input className={styles.input} placeholder="(11) 98765-4321" value={formData.telefone || ''} onChange={e => onChange({ telefone: e.target.value })} />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>E-mail Corporativo</label>
                    <input className={styles.input} placeholder="contato@empresa.com" value={formData.emailCorporativo || ''} onChange={e => onChange({ emailCorporativo: e.target.value })} />
                </div>
            </div>
        </div>
    );
};

export default StepEndereco;