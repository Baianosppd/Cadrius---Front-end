import { describe, it, expect, beforeEach } from 'vitest';
import { saveDraft, loadDraft, clearDraft, sanitizeDraft, DRAFT_TTL_MS } from '../registrationDraft';

// Ambiente de teste é "node": simula só o sessionStorage que o serviço usa.
class MemoryStorage {
    constructor() { this.m = new Map(); }
    get length() { return this.m.size; }
    key(i) { return [...this.m.keys()][i] ?? null; }
    getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
    setItem(k, v) { this.m.set(k, String(v)); }
    removeItem(k) { this.m.delete(k); }
    clear() { this.m.clear(); }
}
const keys = () => [...window.sessionStorage.m.keys()];

beforeEach(() => { globalThis.window = { sessionStorage: new MemoryStorage() }; });

describe('registrationDraft', () => {
    it('restaura o que foi digitado após recarregar', () => {
        saveDraft('individual', { step: 2, data: { nome: 'Maria', email: 'm@x.com', uf: 'SP' } });
        expect(loadDraft('individual')).toEqual({ step: 2, data: { nome: 'Maria', email: 'm@x.com', uf: 'SP' } });
    });

    it('NUNCA grava senha, CPF, aceite legal nem plano', () => {
        saveDraft('empresa', {
            step: 3,
            data: { razaoSocial: 'A Ltda', senha: 'x', gerenteSenha: 'y', cpf: '1', gerenteCpf: '2', legal: { terms: '1.0' }, plano: 3, planoGratis: true },
        });
        const raw = window.sessionStorage.getItem(keys().find((k) => k.includes('empresa')));
        for (const secret of ['senha', 'gerenteSenha', 'cpf', 'gerenteCpf', 'legal', 'plano']) expect(raw).not.toContain(`"${secret}"`);
        expect(JSON.parse(raw).data).toEqual({ razaoSocial: 'A Ltda' });
    });

    it('expira depois de 24 h', () => {
        saveDraft('individual', { step: 1, data: { nome: 'Ana' } }, 1000);
        expect(loadDraft('individual', { now: 1000 + DRAFT_TTL_MS + 1 })).toBeNull();
        expect(loadDraft('individual')).toBeNull(); // já removido
    });

    it('não restaura passos em que a conta já teria sido criada', () => {
        saveDraft('individual', { step: 5, data: { nome: 'Ana' } });
        expect(loadDraft('individual', { maxStep: 3 }).step).toBe(3);
    });

    it('ignora JSON corrompido e limpa ao concluir', () => {
        window.sessionStorage.setItem('cadrius:draft:individual:v1', '{quebrado');
        expect(loadDraft('individual')).toBeNull();
        saveDraft('individual', { step: 1, data: { nome: 'Ana' } });
        clearDraft('individual');
        expect(loadDraft('individual')).toBeNull();
    });

    it('sanitizeDraft remove undefined e funções', () => {
        expect(sanitizeDraft({ a: 1, b: undefined, c: () => 1 })).toEqual({ a: 1 });
    });
});
