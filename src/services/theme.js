// Tema claro/escuro (CAD-219). Preferência por navegador: 'light' | 'dark' | 'system' (segue o sistema operacional).
// O atributo data-theme no <html> define os tokens; aplicado antes do primeiro render para não "piscar".
const KEY = 'cadrius.theme';
export const THEMES = [['light', 'Claro'], ['dark', 'Escuro'], ['system', 'Automático']];
export const THEME_EVENT = 'cadrius:theme';

function storage() {
    try { return window.localStorage; } catch { return null; }
}

export function getThemePref() {
    const v = storage()?.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
}

export function systemPrefersDark() {
    return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

// Tema efetivo: o escolhido ou, em 'system', o do sistema operacional
export function resolveTheme(pref = getThemePref(), prefersDark = systemPrefersDark()) {
    if (pref === 'light' || pref === 'dark') return pref;
    return prefersDark ? 'dark' : 'light';
}

export function applyTheme(pref = getThemePref()) {
    const theme = resolveTheme(pref);
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    return theme;
}

export function setThemePref(pref) {
    const s = storage();
    if (pref === 'system') s?.removeItem(KEY); else s?.setItem(KEY, pref);
    const theme = applyTheme(pref);
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { pref, theme } }));
    return theme;
}

// Próximo tema no botão de alternância: claro → escuro → automático
export function nextPref(pref) {
    return pref === 'light' ? 'dark' : pref === 'dark' ? 'system' : 'light';
}

export function initTheme() {
    applyTheme();
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    mq?.addEventListener?.('change', () => { if (getThemePref() === 'system') applyTheme('system'); });
}
