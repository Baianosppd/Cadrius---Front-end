// Contraste WCAG 2.x (CAD-220): funções puras usadas no teste automático dos tokens de cor dos dois temas.
export function parseColor(value) {
    const v = String(value || '').trim().toLowerCase();
    let m = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
    if (m) {
        const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
        return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).concat(1);
    }
    m = v.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
    if (m) return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])];
    return null;
}

// Cor translúcida sobre um fundo opaco
export function over(fg, bg) {
    const a = fg[3];
    return [0, 1, 2].map((i) => Math.round(fg[i] * a + bg[i] * (1 - a))).concat(1);
}

function luminance([r, g, b]) {
    const ch = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

export function ratio(fg, bg) {
    const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
    return (a + 0.05) / (b + 0.05);
}

// Variáveis --c-* de um bloco CSS (comentários removidos)
export function readTokens(css, selector) {
    const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const start = clean.indexOf(`${selector} {`);
    if (start < 0) return {};
    const body = clean.slice(clean.indexOf('{', start) + 1, clean.indexOf('}', start));
    const out = {};
    for (const [, name, value] of body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) out[name] = value.trim();
    return out;
}
