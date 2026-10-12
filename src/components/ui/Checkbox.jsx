import styles from './ui.module.css';

// Caixa de seleção com o texto ao lado; clicar no texto marca/desmarca.
export default function Checkbox({ className = '', children, ...rest }) {
    return (
        <label className={[styles.check_row, className].filter(Boolean).join(' ')}>
            <input type="checkbox" {...rest} />
            {children}
        </label>
    );
}
