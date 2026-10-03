import styles from './Step.module.css';
import { FiCreditCard, FiCheckCircle } from 'react-icons/fi';

// O cartão NUNCA é digitado em formulários do Cadrius: ao confirmar, a conta é criada e o cliente é levado
// ao checkout seguro do Stripe (PCI-DSS fica com o Stripe).
const StepPagamento = ({ formData }) => (
    <div className={styles.container}>
        <div className={styles.header}>
            <div className={styles.icon_wrapper}><FiCreditCard className={styles.icon} /></div>
            <div>
                <h2 className={styles.title}>Pagamento</h2>
                <p className={styles.subtitle}>Você será levado ao checkout seguro do Stripe</p>
            </div>
        </div>
        <div className={styles.payment_wrapper}>
            <div className={styles.summary}>
                <h3 className={styles.section_title}>Resumo da assinatura</h3>
                <div className={styles.summary_row}><span>Plano {formData.planoNome}</span><span>{formData.planoPreco}/mês</span></div>
                <div className={styles.summary_total}><span>Total mensal</span><span>{formData.planoPreco}</span></div>
                <p className={styles.summary_note}>Ao clicar em “Próximo” sua conta é criada e você finaliza o pagamento no Stripe. Cancele quando quiser.</p>
                <div className={styles.stripe_info}><FiCheckCircle className={styles.stripe_icon} />Pagamento seguro processado pelo Stripe</div>
            </div>
        </div>
    </div>
);

export default StepPagamento;
