import styles from './ui.module.css';

// Escolha entre poucas opções lado a lado (ex.: Lista | Calendário). options = [{ id, label, icon? }]
export default function Segmented({ options, value, onChange, className = '', ...rest }) {
    return (
        <div role="group" {...rest} className={[styles.segmented, styles.w_fit, className].filter(Boolean).join(' ')}>
            {options.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" aria-pressed={value === id} className={value === id ? styles.seg_on : ''} onClick={() => onChange(id)}>
                    {Icon && <Icon aria-hidden="true" />}{label}
                </button>
            ))}
        </div>
    );
}
