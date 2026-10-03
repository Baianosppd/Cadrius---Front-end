import { describe, it, expect } from 'vitest';
import { individualPayload, companyPayload, validateStep, registrationError, onlyDigits } from '../registration';

describe('registration', () => {
    it('monta o payload individual no contrato novo do back', () => {
        const p = individualPayload({
            nome: ' Maria Silva ', cpf: '529.982.247-25', email: ' m@x.com ', senha: 'abc12345', plano: 2,
            oab: '123', uf: 'SP', area: 'Direito Civil', legal: { terms: '1.0', privacy: '1.0', ciencia: '1.0' },
        });
        expect(p).toMatchObject({
            nome_completo: 'Maria Silva', email: 'm@x.com', senha: 'abc12345', plano_id: 2, area_atuacao: 'civil',
            accepted_terms_version: '1.0', accepted_privacy_version: '1.0', accepted_ciencia_version: '1.0',
        });
        expect(p).not.toHaveProperty('password');
    });

    it('monta o payload da empresa com o gerente aninhado e enums do back', () => {
        const p = companyPayload({
            razaoSocial: 'A Ltda', nomeFantasia: 'A', cnpj: '11.222.333/0001-81', porte: 'grande', regime: 'simples',
            tipoSociedade: 'Sociedade Limitada (LTDA)', gerenteNome: 'João Souza', gerenteCpf: '529.982.247-25',
            gerenteEmail: 'j@a.com', gerenteSenha: 'abc12345', plano: 3,
        });
        expect(p.porte_empresa).toBe('GRANDE_PORTE');
        expect(p.regime_tributario).toBe('SIMPLES_NACIONAL');
        expect(p.tipo_sociedade).toBe('LTDA');
        expect(p.gerente).toMatchObject({ nome_completo: 'João Souza', email: 'j@a.com' });
    });

    it('valida os passos antes de chamar a API', () => {
        expect(validateStep('individual', 1, { nome: 'Maria' })).toMatch(/nome completo/i);
        const ok = { nome: 'Maria Silva', cpf: '52998224725', email: 'm@x.com', senha: '12345678', legalOk: true };
        expect(validateStep('individual', 1, ok)).toBeNull();
        expect(validateStep('individual', 1, { ...ok, legalOk: false })).toMatch(/aceitar/i);
        expect(validateStep('individual', 1, { ...ok, senha: '123' })).toMatch(/8 caracteres/);
        expect(validateStep('individual', 3, {})).toMatch(/plano/i);
        expect(validateStep('empresa', 1, { razaoSocial: 'A', nomeFantasia: 'A', cnpj: '123' })).toMatch(/CNPJ/);
    });

    it('traduz erros do back (inclusive aninhados)', () => {
        expect(registrationError({})).toMatch(/comunicação/);
        expect(registrationError({ response: { data: { senha: ['Senha muito comum.'] } } })).toBe('Senha muito comum.');
        expect(registrationError({ response: { data: { gerente: { cpf: ['CPF inválido.'] } } } })).toBe('CPF inválido.');
    });

    it('onlyDigits', () => { expect(onlyDigits('12.3-4/5')).toBe('12345'); });
});
