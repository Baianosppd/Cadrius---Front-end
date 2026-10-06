// Teste de contraste automático (CAD-220): cada par texto/fundo usado nas telas precisa passar no WCAG AA nos dois temas.
// Se um token mudar e quebrar a leitura, o CI acusa antes de chegar ao escritório.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { over, parseColor, ratio, readTokens } from '../contrast';

const css = readFileSync(fileURLToPath(new URL('../../index.css', import.meta.url)), 'utf8');
const light = readTokens(css, ':root');
const dark = { ...light, ...readTokens(css, ':root[data-theme="dark"], [data-theme="dark"]') };

const AA = 4.5; // texto normal
const UI = 3; // texto grande, ícones e bordas de controles

// [texto, fundo, mínimo]
const PAIRS = [
    ...['ink', 'text', 'text-2', 'muted'].flatMap((t) => ['bg', 'surface', 'surface-2', 'surface-3'].map((b) => [`c-${t}`, `c-${b}`, AA])),
    ['c-subtle', 'c-surface', UI],
    ['c-primary', 'c-surface', AA], // links
    ['c-primary', 'c-bg', AA],
    ['c-primary-700', 'c-primary-50', AA], // selos/abas ativas
    ['#ffffff', 'c-primary-solid', AA], // botão principal
    ['#ffffff', 'c-primary-solid-hover', AA],
    ['c-success', 'c-success-bg', AA], ['c-warning', 'c-warning-bg', AA],
    ['c-danger', 'c-danger-bg', AA], ['c-info', 'c-info-bg', AA],
    ['c-danger', 'c-surface', AA], ['c-success', 'c-surface', AA], ['c-warning', 'c-surface', AA],
    ['c-border-2', 'c-surface', 1.2],
];

function color(tokens, ref, base) {
    const raw = ref.startsWith('#') ? ref : tokens[ref];
    const c = parseColor(raw);
    if (!c) throw new Error(`cor inválida: ${ref} = ${raw}`);
    return c[3] < 1 ? over(c, base) : c;
}

describe('funções de contraste', () => {
    it('calcula a razão WCAG conhecida (preto x branco = 21; #767676 x branco ≈ 4,54)', () => {
        expect(ratio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 1);
        expect(ratio(parseColor('#767676'), parseColor('#fff'))).toBeCloseTo(4.54, 2);
        expect(over(parseColor('rgba(255, 255, 255, .5)'), [0, 0, 0, 1]).slice(0, 3)).toEqual([128, 128, 128]);
    });
});

for (const [name, tokens] of [['claro', light], ['escuro', dark]]) {
    describe(`tema ${name}`, () => {
        it('lê os tokens do index.css', () => {
            expect(tokens['c-surface']).toBeTruthy();
            expect(tokens['c-text']).toBeTruthy();
        });
        it.each(PAIRS)('%s sobre %s ≥ %s:1', (fg, bg, min) => {
            const page = color(tokens, 'c-bg', [255, 255, 255, 1]);
            const surface = color(tokens, 'c-surface', page);
            const back = color(tokens, bg, surface);
            const front = color(tokens, fg, back);
            expect(Number(ratio(front, back).toFixed(2))).toBeGreaterThanOrEqual(min);
        });
    });
}
