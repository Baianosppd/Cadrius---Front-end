// CAD-230: passos de processamento nas regras (calcular, tabela), passo condicional e Google
import { describe, expect, it } from 'vitest';
import { emptyAction, producedVars, ruleBody, STEP_STATUS } from '../rules';

describe('regras com processamento', () => {
    it('passos anteriores oferecem variáveis aos seguintes', () => {
        const acoes = [
            { type: 'calcular', params: { nome: 'multa', expressao: '1', formato: 'moeda' } },
            { type: 'tabela', params: { nome: 'abertos', fonte: 'honorarios_em_aberto' } },
            { type: 'notify', params: { titulo: 'x', mensagem: 'y' } },
        ];
        expect(producedVars(acoes, 0)).toEqual([]);
        expect(producedVars(acoes, 1).map((v) => v.chave)).toEqual(['calc.multa', 'calc.multa_valor']);
        expect(producedVars(acoes, 2).map((v) => v.chave)).toContain('tabela.abertos.texto');
    });

    it('corpo da API leva a condição do passo e converte números', () => {
        const body = ruleBody({
            nome: 'Cobrança', gatilho: 'receivable_due', condicoes: [],
            acoes: [
                { ...emptyAction('tabela'), params: { nome: 'abertos', fonte: 'honorarios_em_aberto', limite: '20' } },
                { ...emptyAction('google_evento'), somente_se: { field: 'tabela.abertos.quantidade', op: 'gt', value: '0' } },
                { ...emptyAction('notify'), somente_se: { field: '', op: '' } },
            ],
        });
        expect(body.actions[0].params.limite).toBe(20);
        expect(body.actions[1].params.duracao_min).toBe(60);
        expect(body.actions[1].somente_se).toEqual({ field: 'tabela.abertos.quantidade', op: 'gt', value: '0' });
        expect(body.actions[2].somente_se).toBeUndefined();
    });

    it('passo pulado tem rótulo', () => {
        expect(STEP_STATUS.pulado[0]).toMatch(/Pulado/);
    });
});
