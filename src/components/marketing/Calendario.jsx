import { useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import styles from '../ui/ui.module.css';
import { Button } from '../ui';
import { CHANNEL_COLOR, CHANNEL_LABEL, monthGrid } from '../../services/marketing';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Calendário editorial do mês (CAD-219): cada dia mostra os conteúdos com a cor do canal
export default function Calendario({ items, onOpen }) {
    const now = new Date();
    const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
    const weeks = monthGrid(ym.y, ym.m, items);
    const raw = new Date(ym.y, ym.m, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const title = raw.charAt(0).toUpperCase() + raw.slice(1);
    const move = (d) => setYm(({ y, m }) => { const x = new Date(y, m + d, 1); return { y: x.getFullYear(), m: x.getMonth() }; });
    const today = now.toDateString();
    return (
        <div className={styles.cal}>
            <div className={styles.cal_head}>
                <Button size="sm" icon={FiChevronLeft} onClick={() => move(-1)} aria-label="Mês anterior" />
                <strong className={styles.cal_title}>{title}</strong>
                <Button size="sm" icon={FiChevronRight} onClick={() => move(1)} aria-label="Próximo mês" />
            </div>
            <div className={styles.cal_grid} role="grid" aria-label={`Calendário de ${title}`}>
                {WEEKDAYS.map((d) => <div key={d} className={styles.cal_wd} role="columnheader">{d}</div>)}
                {weeks.flat().map((c) => (
                    <div key={c.date.toISOString()} role="gridcell"
                        className={`${styles.cal_day} ${c.inMonth ? '' : styles.cal_out} ${c.date.toDateString() === today ? styles.cal_today : ''}`}>
                        <span className={styles.cal_num}>{c.day}</span>
                        {c.items.slice(0, 3).map((it) => (
                            <button key={it.id} type="button" className={styles.cal_item} style={{ '--ch': CHANNEL_COLOR[it.canal] || 'var(--c-muted)' }}
                                onClick={() => onOpen(it.id)} title={`${CHANNEL_LABEL[it.canal]}: ${it.titulo || it.tema}`}>
                                {it.titulo || it.tema}
                            </button>
                        ))}
                        {c.items.length > 3 && <span className={styles.cal_more}>+{c.items.length - 3}</span>}
                    </div>
                ))}
            </div>
        </div>
    );
}
