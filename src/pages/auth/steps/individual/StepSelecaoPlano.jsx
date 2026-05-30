import { useState } from 'react';
import styles from './Step.module.css';
import { FiDollarSign, FiCheck } from 'react-icons/fi';

const plans = [
    {
        id: 'starter',
        name: 'Starter',
        price: 'Grátis',
        features: ['Até 5 documentos/mês', '1 usuário', 'Recursos básicos'],
    },
    {
        id: 'professional',
        name: 'Professional',
        price: 'R$ 99',
        period: '/mês',
        popular: true,
        features: ['Documentos ilimitados', 'Automações avançadas', 'Suporte prioritário', 'Templates premium'],
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 'R$ 299',
        period: '/mês',
        features: ['Recursos completos', 'Assistente IA dedicado', 'Integrações ilimitadas', 'Consultoria jurídica'],
    },
];

const StepSelecaoPlano = ({ formData, onChange }) => {
    const [selected, setSelected] = useState(formData.plano || '');

    const handleSelect = (id) => {
        setSelected(id);
        onChange({ plano: id });
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.icon_wrapper}>
                    <FiDollarSign className={styles.icon} />
                </div>
                <div>
                    <h2 className={styles.title}>Seleção de Plano</h2>
                    <p className={styles.subtitle}>Escolha o plano ideal para você</p>
                </div>
            </div>

            <div className={styles.plans_grid}>
                {plans.map(plan => (
                    <div
                        key={plan.id}
                        className={`${styles.plan_card} ${selected === plan.id ? styles.plan_selected : ''}`}
                        onClick={() => handleSelect(plan.id)}
                    >
                        {plan.popular && <span className={styles.popular_badge}>Popular</span>}
                        <p className={styles.plan_name}>{plan.name}</p>
                        <div className={styles.plan_price}>
                            <span className={styles.price_value}>{plan.price}</span>
                            {plan.period && <span className={styles.price_period}>{plan.period}</span>}
                        </div>
                        <div className={styles.plan_features}>
                            {plan.features.map((f, i) => (
                                <div key={i} className={styles.plan_feature}>
                                    <FiCheck className={styles.feature_check} />
                                    {f}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StepSelecaoPlano;