import styles from '../individual/Step.module.css';
import empStyles from './StepEmpresa.module.css';
import { FiGrid } from 'react-icons/fi';

const portes = [
    { id: 'mei', label: 'MEI', description: 'Microempreendedor Individual' },
    { id: 'me', label: 'ME', description: 'Microempresa' },
    { id: 'epp', label: 'EPP', description: 'Empresa de Pequeno Porte' },
    { id: 'grande', label: 'Grande Porte', description: 'Acima de 100 funcionários' },
];

const regimes = [
    { id: 'simples', label: 'Simples Nacional' },
    { id: 'presumido', label: 'Lucro Presumido' },
    { id: 'real', label: 'Lucro Real' },
];

const StepClassificacao = ({ formData, onChange }) => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.icon_wrapper}>
                    <FiGrid className={styles.icon} />
                </div>
                <div>
                    <h2 className={styles.title}>Classificação</h2>
                    <p className={styles.subtitle}>Defina a natureza e porte da empresa</p>
                </div>
            </div>

            <div>
                <label className={styles.label}>Porte da Empresa</label>
                <div className={empStyles.option_grid}>
                    {portes.map(p => (
                        <div
                            key={p.id}
                            className={`${empStyles.option_card} ${formData.porte === p.id ? empStyles.option_selected : ''}`}
                            onClick={() => onChange({ porte: p.id })}
                        >
                            <p className={empStyles.option_label}>{p.label}</p>
                            <span className={empStyles.option_description}>{p.description}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <label className={styles.label}>Regime Tributário</label>
                <div className={empStyles.option_grid_3}>
                    {regimes.map(r => (
                        <div
                            key={r.id}
                            className={`${empStyles.option_card} ${formData.regime === r.id ? empStyles.option_selected : ''}`}
                            onClick={() => onChange({ regime: r.id })}
                        >
                            <p className={empStyles.option_label}>{r.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StepClassificacao;