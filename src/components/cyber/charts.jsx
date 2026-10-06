import { useState } from 'react';
import { FiAlertOctagon, FiAlertTriangle } from 'react-icons/fi';
import styles from './charts.module.css';
import { levelOf, niceMax, scoreLevel } from '../../services/cyber';

const SERIES = [
    { key: 'falhas_login', label: 'Logins com falha', color: 'var(--viz-1)' },
    { key: 'negados', label: 'Acessos negados / bloqueios', color: 'var(--viz-2)' },
];

// Barras agrupadas por hora (24 h): duas séries, legenda, dica ao passar o mouse e tabela alternativa.
export function HourlyBars({ data = [], height = 180 }) {
    const [hover, setHover] = useState(null);
    const [table, setTable] = useState(false);
    const W = 720, H = height, PAD_L = 28, PAD_B = 22, PAD_T = 8;
    const max = Math.max(1, ...data.flatMap((d) => SERIES.map((s) => d[s.key] || 0)));
    const top = niceMax(max);
    const slot = (W - PAD_L) / Math.max(data.length, 1);
    const barW = Math.max(2, Math.min(10, (slot - 6) / 2));
    const y = (v) => H - PAD_B - ((H - PAD_B - PAD_T) * v) / top;
    const total = (key) => data.reduce((a, d) => a + (d[key] || 0), 0);
    return (
        <div className={`${styles.viz} ${styles.chart}`}>
            <div className={styles.legend}>
                {SERIES.map((s) => (
                    <span key={s.key} className={styles.legend_item}>
                        <span className={styles.swatch} style={{ background: s.color }} aria-hidden="true" />
                        {s.label} <span className={styles.num}>{total(s.key)}</span>
                    </span>
                ))}
                <span className={styles.legend_tools}>
                    <button type="button" className="link_btn" onClick={() => setTable((t) => !t)}
                        style={{ background: 'none', border: 0, color: 'var(--c-primary)', cursor: 'pointer', fontSize: 'var(--fs-sm)' }}>
                        {table ? 'Ver gráfico' : 'Ver tabela'}
                    </button>
                </span>
            </div>
            {table ? (
                <div style={{ maxHeight: 260, overflow: 'auto' }}>
                    <table style={{ width: '100%', fontSize: 'var(--fs-sm)', borderCollapse: 'collapse' }}>
                        <thead><tr><th style={{ textAlign: 'left' }}>Hora</th>{SERIES.map((s) => <th key={s.key} style={{ textAlign: 'right' }}>{s.label}</th>)}</tr></thead>
                        <tbody>{data.map((d) => (
                            <tr key={d.hora}><td>{d.hora}</td>{SERIES.map((s) => <td key={s.key} style={{ textAlign: 'right' }}>{d[s.key] || 0}</td>)}</tr>
                        ))}</tbody>
                    </table>
                </div>
            ) : (
                <div style={{ position: 'relative' }} onMouseLeave={() => setHover(null)}>
                    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img"
                        aria-label={`Últimas 24 horas: ${total('falhas_login')} logins com falha e ${total('negados')} acessos negados`}>
                        {[0, top / 2, top].map((t) => (
                            <g key={t}>
                                <line x1={PAD_L} x2={W} y1={y(t)} y2={y(t)} className={styles.grid_line} />
                                <text x={PAD_L - 6} y={y(t) + 3} textAnchor="end" className={styles.axis_text}>{Math.round(t)}</text>
                            </g>
                        ))}
                        {data.map((d, i) => {
                            const x0 = PAD_L + i * slot;
                            const cx = x0 + slot / 2;
                            return (
                                <g key={d.hora}>
                                    <rect x={x0} y={PAD_T} width={slot} height={H - PAD_B - PAD_T} rx={4}
                                        className={`${styles.hit} ${hover === i ? styles.hit_on : ''}`} onMouseEnter={() => setHover(i)} />
                                    {SERIES.map((s, k) => {
                                        const v = d[s.key] || 0;
                                        const bx = cx - barW - 1 + k * (barW + 2);
                                        return v > 0 && <path key={s.key} d={roundTop(bx, y(v), barW, H - PAD_B - y(v))} fill={s.color} pointerEvents="none" />;
                                    })}
                                    {i % 3 === 0 && <text x={cx} y={H - 6} textAnchor="middle" className={styles.axis_text}>{d.hora}</text>}
                                </g>
                            );
                        })}
                    </svg>
                    {hover !== null && data[hover] && (
                        <div className={styles.tooltip} style={{ left: `${((PAD_L + (hover + 0.5) * slot) / W) * 100}%`, top: 8 }}>
                            <div className={styles.tooltip_title}>{data[hover].hora}</div>
                            {SERIES.map((s) => (
                                <div key={s.key} className={styles.tooltip_row}>
                                    <span><span className={styles.swatch} style={{ background: s.color }} />{s.label}</span>
                                    <span className={styles.num}>{data[hover][s.key] || 0}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function roundTop(x, y, w, h) {
    const r = Math.min(4, w / 2, h);
    return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}



// Medidor de uso (CPU, memória, disco, conexões): cor pela gravidade + texto, nunca só a cor
export function Meter({ label, pct, detail, warn = 70, crit = 85 }) {
    const value = Math.max(0, Math.min(100, Number(pct) || 0));
    const level = levelOf(value, warn, crit);
    return (
        <div className={`${styles.viz} ${styles.meter}`}>
            <div className={styles.meter_head}><span>{label}</span><span className={styles.meter_value}>{value.toFixed(0)}%</span></div>
            <div className={styles.meter_track} role="meter" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
                <div className={`${styles.meter_fill} ${level === 'crit' ? styles.meter_crit : level === 'warn' ? styles.meter_warn : ''}`}
                    style={{ width: `${value}%` }} />
            </div>
            <span className={`${styles.meter_note} ${level === 'crit' ? styles.state_crit : level === 'warn' ? styles.state_warn : ''}`}>
                {level === 'crit' && <><FiAlertOctagon aria-hidden="true" /> Crítico · </>}
                {level === 'warn' && <><FiAlertTriangle aria-hidden="true" /> Atenção · </>}
                {detail}
            </span>
        </div>
    );
}


// Nota geral (0–100) num anel + rótulo com ícone
export function ScoreRing({ value }) {
    const n = Math.max(0, Math.min(100, Math.round(value ?? 0)));
    const { label, tone, Icon } = scoreLevel(n);
    const R = 34, C = 2 * Math.PI * R;
    const color = { good: 'var(--viz-good)', warn: 'var(--viz-warn)', crit: 'var(--viz-crit)' }[tone];
    return (
        <div className={`${styles.viz} ${styles.score}`}>
            <svg width="84" height="84" viewBox="0 0 84 84" className={styles.score_ring} aria-hidden="true">
                <circle cx="42" cy="42" r={R} fill="none" stroke="var(--c-surface-3)" strokeWidth="8" />
                <circle cx="42" cy="42" r={R} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${(C * n) / 100} ${C}`} transform="rotate(-90 42 42)" />
            </svg>
            <div>
                <div className={styles.score_num} aria-label={`Nota de segurança ${n} de 100`}>{n}</div>
                <div className={styles.score_label} style={{ color }}><Icon aria-hidden="true" /> {label}</div>
            </div>
        </div>
    );
}
