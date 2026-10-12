import styles from '../individual/Step.module.css';
import { FiMapPin } from 'react-icons/fi';
import { Field, Input, Select } from '../../../../components/ui';

const estados = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

// Campos de texto do endereço: [chave, rótulo, placeholder, props extras]
const CAMPOS = [
    ['cep', 'CEP', '00000-000', { inputMode: 'numeric', autoComplete: 'postal-code' }],
    ['logradouro', 'Logradouro', 'Rua, Avenida, etc.', { autoComplete: 'address-line1' }],
    ['numero', 'Número', '123', {}],
    ['bairro', 'Bairro', 'Centro', {}],
    ['cidade', 'Cidade', 'São Paulo', { autoComplete: 'address-level2' }],
];

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
                {CAMPOS.map(([k, label, ph, extra]) => (
                    <Field key={k} label={label}>
                        <Input size="lg" {...extra} placeholder={ph} value={formData[k] || ''} onChange={(e) => onChange({ [k]: e.target.value })} />
                    </Field>
                ))}
                <Field label="UF">
                    <Select size="lg" value={formData.uf || ''} onChange={(e) => onChange({ uf: e.target.value })}>
                        <option value="">UF</option>
                        {estados.map((e) => <option key={e} value={e}>{e}</option>)}
                    </Select>
                </Field>
                <Field label="Telefone Principal">
                    <Input size="lg" type="tel" autoComplete="tel" placeholder="(11) 98765-4321" value={formData.telefone || ''} onChange={(e) => onChange({ telefone: e.target.value })} />
                </Field>
                <Field label="E-mail Corporativo">
                    <Input size="lg" type="email" placeholder="contato@empresa.com" value={formData.emailCorporativo || ''} onChange={(e) => onChange({ emailCorporativo: e.target.value })} />
                </Field>
            </div>
        </div>
    );
};

export default StepEndereco;
