import styles from './ui.module.css';

const PILL = {
    green: styles.pill_green, yellow: styles.pill_yellow, orange: styles.pill_orange,
    red: styles.pill_red, blue: styles.pill_blue, gray: styles.pill_gray,
};

export function Pill({ tone = 'gray', children }) {
    return <span className={`${styles.pill} ${PILL[tone] || PILL.gray}`}>{children}</span>;
}

// Pill a partir de um mapa de estado → rótulo/cor (ver statusMaps.js)
export function StatusPill({ map, value }) {
    const item = map[value] || { label: value ?? '—', tone: 'gray' };
    return <Pill tone={item.tone}>{item.label}</Pill>;
}
