import styles from './Step.module.css';
import { FiCreditCard, FiCheckCircle } from 'react-icons/fi';

const StepPagamento = ({ formData, onChange }) => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.icon_wrapper}>
                    <FiCreditCard className={styles.icon} />
                </div>
                <div>
                    <h2 className={styles.title}>Pagamento</h2>
                    <p className={styles.subtitle}>Complete o pagamento de forma segura</p>
                </div>
            </div>

            <div className={styles.payment_wrapper}>
                <div className={styles.card_form}>
                    <h3 className={styles.section_title}>Dados do Cartão</h3>
                    <div className={styles.field}>
                        <label className={styles.label}>Número do Cartão</label>
                        <input className={styles.input} placeholder="0000 0000 0000 0000" value={formData.cartao || ''} onChange={e => onChange({ cartao: e.target.value })} />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Nome no Cartão</label>
                        <input className={styles.input} placeholder="NOME COMO ESTÁ NO CARTÃO" value={formData.nomeCartao || ''} onChange={e => onChange({ nomeCartao: e.target.value })} />
                    </div>
                    <div className={styles.fields_grid}>
                        <div className={styles.field}>
                            <label className={styles.label}>Validade</label>
                            <input className={styles.input} placeholder="MM/AA" value={formData.validade || ''} onChange={e => onChange({ validade: e.target.value })} />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>CVV</label>
                            <input className={styles.input} placeholder="123" value={formData.cvv || ''} onChange={e => onChange({ cvv: e.target.value })} />
                        </div>
                    </div>
                    <div className={styles.stripe_info}>
                        <FiCheckCircle className={styles.stripe_icon} />
                        Pagamento seguro processado via Stripe
                    </div>
                </div>

                <div className={styles.summary}>
                    <h3 className={styles.section_title}>Resumo da Assinatura</h3>
                    <div className={styles.summary_row}>
                        <span>Plano Profissional</span>
                        <span>R$ 99,00</span>
                    </div>
                    <div className={styles.summary_row}>
                        <span>Desconto (Primeiro mês)</span>
                        <span className={styles.discount}>- R$ 20,00</span>
                    </div>
                    <div className={styles.summary_total}>
                        <span>Total</span>
                        <span>R$ 79,00</span>
                    </div>
                    <p className={styles.summary_note}>Você será cobrado mensalmente. Cancele a qualquer momento sem custos adicionais.</p>
                </div>
            </div>
        </div>
    );
};

export default StepPagamento;