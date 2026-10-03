import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Markdown from '../Markdown';

const html = (text) => renderToStaticMarkup(<Markdown text={text} />);

describe('Markdown (documentos legais)', () => {
    it('renderiza títulos, negrito, listas e tabelas', () => {
        const out = html('# Título\n\nTexto **forte**\n\n- a\n- b\n\n| Cat | Ex |\n|---|---|\n| Dados | CPF |');
        expect(out).toContain('Título');
        expect(out).toContain('<strong>forte</strong>');
        expect(out).toContain('<li>a</li>');
        expect(out).toContain('<th');
        expect(out).toContain('CPF');
    });

    it('nunca injeta HTML vindo do servidor', () => {
        const out = html('<script>alert(1)</script> e <img src=x onerror=alert(1)>');
        expect(out).not.toContain('<script');
        expect(out).not.toContain('<img');
        expect(out).toContain('&lt;script&gt;');
    });
});
