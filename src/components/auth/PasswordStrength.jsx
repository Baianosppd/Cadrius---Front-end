import s from './AuthShell.module.css';

// Barra de força + requisitos à vista (CAD-226)
export default function PasswordStrength({ checks, id = 'pwd-rules' }) {
    const done = checks.filter((c) => c.ok).length;
    const pct = checks.length ? Math.round((done / checks.length) * 100) : 0;
    const level = pct === 100 ? 'forte' : pct >= 60 ? 'média' : 'fraca';
    return (
        <div className={s.strength} id={id}>
            <div className={s.strength_head}>
                <span>Força da senha</span>
                <strong className={s[`lvl_${pct === 100 ? 'ok' : pct >= 60 ? 'mid' : 'low'}`]}>{done === 0 ? '—' : level}</strong>
            </div>
            <div className={s.strength_bar} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Força da senha">
                <span style={{ width: `${pct}%` }} className={s[`bar_${pct === 100 ? 'ok' : pct >= 60 ? 'mid' : 'low'}`]} />
            </div>
            <ul className={s.checks}>
                {checks.map((c) => <li key={c.label} className={c.ok ? s.check_ok : s.check_todo}>{c.ok ? '✓' : '○'} {c.label}</li>)}
            </ul>
        </div>
    );
}
