import { useEffect, useState } from 'react';
import { FiDollarSign, FiCheck } from 'react-icons/fi';
import api, { API_ORIGIN } from '../../services/api';
import styles from '../../pages/auth/steps/individual/Step.module.css';

// Planos reais vindos do back (GET /api/billing/plans/) — id numérico é o que o cadastro e o checkout exigem.
export default function PlanPicker({ formData, onChange, subtitle }) {
    const [plans, setPlans] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        api.get(`${API_ORIGIN}/api/billing/plans/`).then((r) => setPlans(r.data)).catch(() => setError(true));
    }, []);

    const select = (plan) => onChange({ plano: plan.id, planoNome: plan.name, planoPreco: plan.price, planoGratis: plan.price === 'Grátis' });

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.icon_wrapper}><FiDollarSign className={styles.icon} /></div>
                <div>
                    <h2 className={styles.title}>Seleção de Plano</h2>
                    <p className={styles.subtitle}>{subtitle}</p>
                </div>
            </div>
            {error && <p role="alert">Não foi possível carregar os planos. Recarregue a página.</p>}
            {!plans && !error && <p>Carregando planos…</p>}
            <div className={styles.plans_grid}>
                {(plans || []).map((plan) => (
                    <div
                        key={plan.id}
                        role="radio"
                        aria-checked={formData.plano === plan.id}
                        tabIndex={0}
                        className={`${styles.plan_card} ${formData.plano === plan.id ? styles.plan_selected : ''}`}
                        onClick={() => select(plan)}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && select(plan)}
                    >
                        <p className={styles.plan_name}>{plan.name}</p>
                        <div className={styles.plan_price}>
                            <span className={styles.price_value}>{plan.price}</span>
                            {plan.price !== 'Grátis' && <span className={styles.price_period}>/mês</span>}
                        </div>
                        {plan.description && <p className={styles.subtitle}>{plan.description}</p>}
                        <div className={styles.plan_features}>
                            {plan.features.map((f) => (
                                <div key={f} className={styles.plan_feature}><FiCheck className={styles.feature_check} />{f}</div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <label className={styles.label} style={{ display: "block", marginTop: 16 }}>
                Cupom (opcional)
                <input
                    className={styles.input}
                    value={formData.cupom || ''}
                    maxLength={40}
                    placeholder="Ex.: BEMVINDO"
                    aria-describedby="cupom-help"
                    onChange={(e) => onChange({ cupom: e.target.value.toUpperCase().replace(/\s/g, '') })}
                />
            </label>
            <p id="cupom-help" className={styles.subtitle}>
                Recebeu um cupom do Cadrius? Ele é conferido ao criar a conta: dias extras de teste entram na hora e desconto vale no primeiro pagamento.
            </p>
        </div>
    );
}
