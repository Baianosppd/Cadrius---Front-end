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

    it('transforma links https e e-mails em links (javascript: nunca)', () => {
        const out = html('Revogue em https://myaccount.google.com/permissions ou escreva para **privacidade@cadrius.ia.br**. (https://developers.google.com/terms/x), javascript:alert(1)');
        expect(out).toContain('href="https://myaccount.google.com/permissions"');
        expect(out).toContain('href="mailto:privacidade@cadrius.ia.br"');
        expect(out).toContain('href="https://developers.google.com/terms/x"');
        expect(out).not.toContain('href="javascript');
    });

    it('usa títulos de verdade na página pública', () => {
        const out = renderToStaticMarkup(<Markdown text={'# Política\n\n## Seção'} semantic />);
        expect(out).toContain('<h2');
        expect(out).toContain('<h3');
    });
});

