import styles from './seguranca.module.css';
import { ScalesMark } from '../illustrations/LegalArt';

const PILL = {
    green: styles.pill_green, yellow: styles.pill_yellow, orange: styles.pill_orange,
    red: styles.pill_red, blue: styles.pill_blue, gray: styles.pill_gray,
};

export function Pill({ tone = 'gray', children }) {
    return <span className={`${styles.pill} ${PILL[tone] || PILL.gray}`}>{children}</span>;
}

// Mapas de estado → rótulo/cor, compartilhados entre as telas
export const SEVERITY = {
    critical: { label: 'Crítica', tone: 'red' }, high: { label: 'Alta', tone: 'orange' },
    medium: { label: 'Média', tone: 'yellow' }, low: { label: 'Baixa', tone: 'blue' },
};
export const ALERT_STATUS = {
    open: { label: 'Aberto', tone: 'red' }, ack: { label: 'Em análise', tone: 'yellow' },
    resolved: { label: 'Resolvido', tone: 'green' }, false_positive: { label: 'Falso positivo', tone: 'gray' },
};
export const OUTCOME = {
    success: { label: 'Sucesso', tone: 'green' }, denied: { label: 'Negado', tone: 'orange' },
    error: { label: 'Erro', tone: 'red' },
};
export const CONTROL_STATUS = {
    implemented: { label: 'Implementado', tone: 'green' }, partial: { label: 'Parcial', tone: 'yellow' },
    not_implemented: { label: 'Não implementado', tone: 'red' }, not_applicable: { label: 'Não aplicável', tone: 'gray' },
    not_assessed: { label: 'Não avaliado', tone: 'gray' },
};
export const CHECK_STATUS = {
    pass: { label: 'OK', tone: 'green' }, partial: { label: 'Parcial', tone: 'yellow' },
    fail: { label: 'Falha', tone: 'red' }, unknown: { label: 'Desconhecido', tone: 'gray' },
};

export function StatusPill({ map, value }) {
    const item = map[value] || { label: value ?? '—', tone: 'gray' };
    return <Pill tone={item.tone}>{item.label}</Pill>;
}

export function StatCard({ title, value, note, tone }) {
    const color = { red: '#dc2626', green: '#16a34a', yellow: '#ca8a04' }[tone];
    return (
        <div className={styles.card}>
            <div className={styles.card_title}>{title}</div>
            <div className={styles.card_value} style={color ? { color } : undefined}>{value}</div>
            {note && <div className={styles.card_note}>{note}</div>}
        </div>
    );
}

export function ScoreBar({ value }) {
    const pct = Math.max(0, Math.min(100, Math.round(value ?? 0)));
    const tone = pct >= 80 ? styles.bar_fill_green : pct >= 50 ? styles.bar_fill_yellow : styles.bar_fill_red;
    return (
        <div className={styles.bar} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className={`${styles.bar_fill} ${tone}`} style={{ width: `${pct}%` }} />
        </div>
    );
}

export function Banner({ tone = 'info', children }) {
    const cls = { warn: styles.banner_warn, error: styles.banner_error, ok: styles.banner_ok, info: styles.banner_info }[tone];
    return <div className={`${styles.banner} ${cls}`} role={tone === 'error' ? 'alert' : undefined}>{children}</div>;
}

// Estado vazio. Com "title", vira um estado vazio ilustrado com a próxima ação (CAD-219): explica o que aparece ali
// e oferece o primeiro passo, em vez de uma tela em branco.
export function Empty({ children = 'Nada para mostrar.', title, action }) {
    if (!title) return <div className={styles.empty}>{children}</div>;
    return (
        <div className={`${styles.empty} ${styles.empty_rich}`}>
            <ScalesMark className={styles.empty_art} />
            <div className={styles.empty_title}>{title}</div>
            {children && <div className={styles.empty_text}>{children}</div>}
            {action && <div className={styles.btn_row}>{action}</div>}
        </div>
    );
}

export function PageHeader({ title, subtitle, actions }) {
    return (
        <div className={styles.header_row}>
            <div>
                <h1 className={styles.page_title}>{title}</h1>
                {subtitle && <p className={styles.page_subtitle}>{subtitle}</p>}
            </div>
            {actions && <div className={styles.btn_row}>{actions}</div>}
        </div>
    );
}

export function fmtDateTime(value) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR');
}
export function fmtDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
}

// Mensagem de erro amigável a partir da resposta do back
export function errorMessage(err, fallback = 'Não foi possível concluir. Tente novamente.') {
    const data = err?.response?.data;
    if (!err?.response) return 'Falha de comunicação com o servidor.';
    if (typeof data?.detail === 'string') return data.detail;
    if (data && typeof data === 'object') {
        const first = Object.values(data)[0];
        if (Array.isArray(first) && typeof first[0] === 'string') return first[0];
        if (typeof first === 'string') return first;
    }
    return fallback;
}
