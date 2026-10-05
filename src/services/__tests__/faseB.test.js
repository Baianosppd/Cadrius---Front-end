import { describe, it, expect } from 'vitest';
import { EMPTY_CONTACT, channelStatus, contactBody, formatPhone, parseTags } from '../contacts';
import { missingRequired, setColumnField } from '../imports';
import { isActive, ticketBody } from '../support';

describe('contatos', () => {
    it('etiquetas e corpo da API', () => {
        expect(parseTags('vip, trabalhista ; vip ,')).toEqual(['trabalhista', 'vip']);
        const form = { ...EMPTY_CONTACT, name: ' Ana ', tags: 'b,a', whatsapp_consent: true, consent_source: 'termo assinado' };
        expect(contactBody(form)).toMatchObject({ name: 'Ana', tags: ['a', 'b'], whatsapp_consent: true, consent_source: 'termo assinado' });
        expect(contactBody({ ...form, whatsapp_consent: false })).not.toHaveProperty('consent_source');   // nada mudou
    });

    it('situação dos canais', () => {
        expect(channelStatus({ opted_out: true, can_whatsapp: true }).tone).toBe('red');
        expect(channelStatus({ can_whatsapp: true, can_email: true }).label).toBe('Pode receber: WhatsApp e e-mail');
        expect(channelStatus({}).label).toBe('Sem consentimento');
        expect(formatPhone('11988887777')).toBe('(11) 98888-7777');
        expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
    });
});

describe('importação', () => {
    it('mapeamento: um campo por coluna e obrigatórios', () => {
        const fields = [{ key: 'name', label: 'Nome', required: true }, { key: 'email', label: 'E-mail', required: false }];
        expect(missingRequired(fields, { 0: 'email' })).toEqual(['Nome']);
        expect(setColumnField({ 0: 'name', 1: 'email' }, 2, 'name')).toEqual({ 1: 'email', 2: 'name' });
        expect(setColumnField({ 0: 'name' }, 0, '')).toEqual({});
    });
});

describe('suporte', () => {
    it('valida o chamado e só aceita normal/alta do cliente', () => {
        expect(ticketBody({ subject: 'oi', body: 'texto longo' }).ok).toBe(false);
        expect(ticketBody({ subject: 'Erro ao importar', body: 'A linha 3 falha', priority: 'urgente' }, '/importar').body)
            .toEqual({ subject: 'Erro ao importar', body: 'A linha 3 falha', category: 'duvida', priority: 'normal', page_url: '/importar' });
        expect(isActive('aguardando_cliente')).toBe(true);
        expect(isActive('fechado')).toBe(false);
    });
});
