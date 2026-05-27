import styles from './PlanCard.module.css';
import { FiCheck } from 'react-icons/fi';

const CurrentPlan = ({ name, price, billingDate, features }) => (
    <div className={styles.current_plan}>
        <div className={styles.current_plan_header}>
            <h3 className={styles.current_plan_name}>{name}</h3>
            <span className={styles.active_badge}>Ativo</span>
        </div>
        <p className={styles.current_plan_price}>
            <span className={styles.price_value}>{price}</span>
            <span className={styles.price_period}>/mês</span>
        </p>
        <p className={styles.billing_date}>Próxima cobrança em {billingDate}</p>
        <div className={styles.features_list}>
            {features.map((feature, index) => (
                <div key={index} className={styles.feature_item}>
                    <FiCheck className={styles.check_icon} />
                    <span>{feature}</span>
                </div>
            ))}
        </div>
    </div>
);

const OtherPlanItem = ({ name, price, description }) => (
    <div className={styles.other_plan}>
        <div className={styles.other_plan_header}>
            <span className={styles.other_plan_name}>{name}</span>
            <span className={styles.other_plan_price}>{price}</span>
        </div>
        <p className={styles.other_plan_description}>{description}</p>
    </div>
);

const PlanCard = ({ currentPlan, otherPlans = [], onManage }) => {
    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Plano Atual</h2>

            <CurrentPlan {...currentPlan} />

            {otherPlans.length > 0 && (
                <>
                    <h3 className={styles.other_title}>Outros Planos Disponíveis</h3>
                    <div className={styles.other_plans_list}>
                        {otherPlans.map((plan, index) => (
                            <OtherPlanItem key={index} {...plan} />
                        ))}
                    </div>
                </>
            )}

            <button className={styles.manage_button} onClick={onManage}>
                Gerenciar Assinatura
            </button>
        </div>
    );
};

export default PlanCard;