import styles from './ui.module.css';

export default function Checkbox({ className = '', children, ...rest }) {
    return (
        <label className={[styles.check_row, className].filter(Boolean).join(' ')}>
            <input type="checkbox" {...rest} />
            {children}
        </label>
    );
}
