import { useEffect, useState } from 'react';
import { FiMonitor, FiMoon, FiSun } from 'react-icons/fi';
import { THEME_EVENT, THEMES, getThemePref, nextPref, setThemePref } from '../../services/theme';
import styles from './ThemeToggle.module.css';

const ICON = { light: FiSun, dark: FiMoon, system: FiMonitor };
const LABEL = Object.fromEntries(THEMES);

// Alterna o tema (claro → escuro → automático). O rótulo diz o tema atual e o próximo, para leitores de tela.
export default function ThemeToggle({ variant = 'icon' }) {
    const [pref, setPref] = useState(getThemePref);
    useEffect(() => {
        const on = (e) => setPref(e.detail.pref);
        window.addEventListener(THEME_EVENT, on);
        return () => window.removeEventListener(THEME_EVENT, on);
    }, []);
    const Icon = ICON[pref];
    const next = nextPref(pref);
    return (
        <button type="button" className={`${styles.toggle} ${variant === 'dark' ? styles.on_dark : ''}`}
            onClick={() => setThemePref(next)} title={`Tema: ${LABEL[pref]} (clique para ${LABEL[next].toLowerCase()})`}
            aria-label={`Alternar tema (atual: ${LABEL[pref]}; próximo: ${LABEL[next]})`}>
            <Icon size={18} aria-hidden="true" />
            {variant === 'label' && <span>{LABEL[pref]}</span>}
        </button>
    );
}
