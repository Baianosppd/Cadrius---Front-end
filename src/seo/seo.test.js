import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PROD_HOST, SITE_URL, seoFor, sitemapPaths } from './seo';

describe('seoFor', () => {
    it('indexa só as páginas públicas em produção', () => {
        expect(seoFor('/', PROD_HOST).robots).toBe('index, follow');
        expect(seoFor('/criar-conta/', PROD_HOST)).toMatchObject({ robots: 'index, follow', canonical: `${SITE_URL}/criar-conta` });
        expect(seoFor('/', 'app-teste.cadrius.ia.br').robots).toBe('noindex, nofollow');
    });

    it('telas logadas e links com token nunca são indexados', () => {
        for (const path of ['/dashboard', '/documents/12', '/portal/abc', '/captacao/x', '/gestao/usuarios']) {
            const seo = seoFor(path, PROD_HOST);
            expect(seo.robots).toBe('noindex, nofollow');
            expect(seo.canonical).toBeNull();
        }
        expect(seoFor('/documents/12', PROD_HOST).title).toBe('Documentos — Cadrius');
    });

    it('títulos e descrições públicos têm tamanho bom para o Google', () => {
        for (const path of sitemapPaths()) {
            const { title, description } = seoFor(path, PROD_HOST);
            expect(title.length).toBeLessThanOrEqual(65);
            expect(description.length).toBeGreaterThanOrEqual(70);
            expect(description.length).toBeLessThanOrEqual(170);
        }
    });

    it('sitemap.xml lista exatamente as páginas públicas', () => {
        const xml = readFileSync(new URL('../../public/sitemap.xml', import.meta.url), 'utf8');
        const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
        expect(locs).toEqual(sitemapPaths().map((p) => `${SITE_URL}${p}`));
    });
});
