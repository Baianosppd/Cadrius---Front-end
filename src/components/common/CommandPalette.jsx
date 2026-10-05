import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiBriefcase, FiClock, FiFileText, FiSearch, FiUser, FiZap } from 'react-icons/fi';
import useAuth from '../../hooks/useAuth';
import { OPEN_EVENT, filterItems, recent, remember, searchRemote, staticItems } from '../../services/search';
import styles from './CommandPalette.module.css';

const GROUP_ICON = { 'Ações rápidas': FiZap, Contatos: FiUser, Processos: FiBriefcase, Documentos: FiFileText, Recentes: FiClock };
const ORDER = ['Recentes', 'Telas', 'Ações rápidas', 'Contatos', 'Processos', 'Documentos'];

// Paleta de comandos (CAD-220): Ctrl+K / Cmd+K abre; setas navegam; Enter abre; Esc fecha
export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const close = useCallback(() => setOpen(false), []);
    useEffect(() => {
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o); }
        };
        const onOpen = () => setOpen(true);
        window.addEventListener('keydown', onKey);
        window.addEventListener(OPEN_EVENT, onOpen);
        return () => { window.removeEventListener('keydown', onKey); window.removeEventListener(OPEN_EVENT, onOpen); };
    }, []);
    return open ? <Palette onClose={close} /> : null;
}

function Palette({ onClose }) {
    const navigate = useNavigate();
    const { isOrgManager } = useAuth();
    const [query, setQuery] = useState('');
    const [remote, setRemote] = useState({ q: '', items: [] });
    const [active, setActive] = useState(0);
    const input = useRef(null);
    const fixed = useMemo(() => staticItems(isOrgManager), [isOrgManager]);

    useEffect(() => { input.current?.focus(); }, []);
    useEffect(() => {
        const q = query.trim();
        if (q.length < 2) return undefined;
        let live = true;
        const t = setTimeout(() => searchRemote(q).then((items) => { if (live) setRemote({ q, items }); }), 250);
        return () => { live = false; clearTimeout(t); };
    }, [query]);

    const q = query.trim();
    const remoteItems = q.length >= 2 && remote.q === q ? remote.items : [];
    const results = q ? [...filterItems(fixed, q, 8), ...remoteItems] : [...recent().map((r) => ({ ...r, id: `r-${r.id}`, ref: r.id })), ...fixed.filter((i) => i.group === 'Ações rápidas').slice(0, 5)];
    const groups = ORDER.map((g) => [g, results.filter((r) => r.group === g)]).filter(([, list]) => list.length);
    const flat = groups.flatMap(([, list]) => list);
    const position = new Map(flat.map((it, i) => [it.id, i]));
    const current = Math.min(active, Math.max(flat.length - 1, 0));

    const go = (item) => {
        if (!item) return;
        remember(item);
        onClose();
        navigate(item.to);
    };
    const onKey = (e) => {
        if (e.key === 'Escape') { e.preventDefault(); onClose(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((current + 1) % Math.max(flat.length, 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((current - 1 + flat.length) % Math.max(flat.length, 1)); }
        else if (e.key === 'Enter') { e.preventDefault(); go(flat[current]); }
    };
    return (
        <div className={styles.overlay} onMouseDown={onClose}>
            <div className={styles.box} role="dialog" aria-modal="true" aria-label="Busca global" onMouseDown={(e) => e.stopPropagation()} onKeyDown={onKey}>
                <div className={styles.search}>
                    <FiSearch className={styles.search_icon} aria-hidden="true" />
                    <input ref={input} className={styles.input} value={query} placeholder="Buscar telas, ações, clientes, processos ou documentos…"
                        onChange={(e) => { setQuery(e.target.value); setActive(0); }} aria-label="Buscar" role="combobox" aria-expanded="true"
                        aria-controls="palette-list" aria-activedescendant={flat[current] ? `pal-${flat[current].id}` : undefined} />
                    <kbd className={styles.kbd}>Esc</kbd>
                </div>
                <div className={styles.list} id="palette-list" role="listbox">
                    {flat.length === 0 && <div className={styles.empty}>{q.length >= 2 ? 'Nada encontrado. Tente outro termo.' : 'Digite para buscar.'}</div>}
                    {groups.map(([group, list]) => (
                        <div key={group} role="group" aria-label={group}>
                            <div className={styles.group}>{group}</div>
                            {list.map((item) => {
                                const i = position.get(item.id);
                                const Icon = item.icon || GROUP_ICON[group] || FiArrowRight;
                                return (
                                    <div key={item.id} id={`pal-${item.id}`} role="option" aria-selected={i === current}
                                        className={`${styles.item} ${i === current ? styles.item_on : ''}`}
                                        onMouseEnter={() => setActive(i)} onClick={() => go(item)}>
                                        <Icon className={styles.item_icon} aria-hidden="true" />
                                        <span className={styles.item_label}>{item.label}</span>
                                        {item.hint && <span className={styles.item_hint}>{item.hint}</span>}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
                <div className={styles.foot}><span><kbd className={styles.kbd}>↑</kbd><kbd className={styles.kbd}>↓</kbd> navegar</span><span><kbd className={styles.kbd}>Enter</kbd> abrir</span><span><kbd className={styles.kbd}>Ctrl</kbd>+<kbd className={styles.kbd}>K</kbd> abre de qualquer tela</span></div>
            </div>
        </div>
    );
}
