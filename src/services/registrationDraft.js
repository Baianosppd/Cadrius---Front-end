// Rascunho do cadastro (CAD-150): recarregar a página não apaga o que foi digitado.
// Fica só no sessionStorage (some ao fechar a aba) e NUNCA guarda segredos nem dados de identificação sensíveis.
export const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
export const DRAFT_VERSION = 1;

// Nunca persistidos: senhas, CPFs, aceite legal (o usuário confirma de novo) e escolha de plano (reselecionar).
export const EXCLUDED_FIELDS = [
    'senha', 'confirmarSenha', 'gerenteSenha', 'gerenteConfirmarSenha',
    'cpf', 'gerenteCpf',
    'legal',
    'plano', 'planoNome', 'planoPreco', 'planoGratis',
];

const keyFor = (kind) => `cadrius:draft:${kind}:v${DRAFT_VERSION}`;

function storage() {
    try { return window.sessionStorage; } catch { return null; }
}

export function sanitizeDraft(formData = {}) {
    return Object.fromEntries(
        Object.entries(formData).filter(([k, v]) => !EXCLUDED_FIELDS.includes(k) && v !== undefined && typeof v !== 'function'),
    );
}

export function saveDraft(kind, { step, data }, now = Date.now()) {
    const s = storage();
    if (!s) return false;
    try {
        s.setItem(keyFor(kind), JSON.stringify({ savedAt: now, step, data: sanitizeDraft(data) }));
        return true;
    } catch { return false; }
}

// maxStep: não restaura passos em que a conta já teria sido criada (plano/pagamento/confirmação).
export function loadDraft(kind, { maxStep = Infinity, now = Date.now() } = {}) {
    const s = storage();
    if (!s) return null;
    try {
        const raw = s.getItem(keyFor(kind));
        if (!raw) return null;
        const draft = JSON.parse(raw);
        if (!draft || now - draft.savedAt > DRAFT_TTL_MS || typeof draft.data !== 'object') {
            s.removeItem(keyFor(kind));
            return null;
        }
        return { step: Math.min(Math.max(Number(draft.step) || 1, 1), maxStep), data: sanitizeDraft(draft.data) };
    } catch { return null; }
}

export function clearDraft(kind) {
    try { storage()?.removeItem(keyFor(kind)); } catch { /* sem storage: nada a limpar */ }
}
