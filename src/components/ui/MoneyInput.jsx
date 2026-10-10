import styles from './ui.module.css';
import { maskMoney } from '../../utils/format';

// Campo de dinheiro com máscara de caixa: só aceita números e sempre mostra 1.234,56.
// onChange recebe o texto já formatado (não o evento).
export default function MoneyInput({ value, onChange, className = '', ...rest }) {
    return (
        <input {...rest} className={`${styles.input} ${className}`} inputMode="numeric" placeholder="0,00"
            value={maskMoney(value)} onChange={(e) => onChange(maskMoney(e.target.value))} />
    );
}
