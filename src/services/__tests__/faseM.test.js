// CAD-226: documento escolhido no Assistente
import { describe, expect, it } from 'vitest';
import { DOC_ACTIONS, splitDocRef } from '../assistant';

describe('splitDocRef', () => {
    it('separa o marcador do documento do texto da pessoa', () => {
        expect(splitDocRef('Extraia os dados\n\n[documento:12 "Contrato Maria"]'))
            .toEqual({ body: 'Extraia os dados', doc: { id: 12, nome: 'Contrato Maria' } });
    });
    it('sem marcador devolve o texto como está', () => {
        expect(splitDocRef('Oi [documento:x]')).toEqual({ body: 'Oi [documento:x]', doc: null });
    });
    it('atalhos de documento cobrem extração e planejamento', () => {
        expect(DOC_ACTIONS.map((x) => x.label)).toEqual(expect.arrayContaining(['Extrair os dados', 'Montar plano de ação']));
    });
});
