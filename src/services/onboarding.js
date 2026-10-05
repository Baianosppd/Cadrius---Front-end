// Primeiros passos do escritório (CAD-219). Um checklist curto e visível no Painel: mostra o progresso (efeito
// Zeigarnik: tarefas abertas prendem a atenção) e leva direto à tela de cada passo. Some quando tudo estiver feito
// ou quando a pessoa dispensar.
import api from './api';

export const STEPS = [
    { key: 'oab', label: 'Cadastre a OAB para receber as publicações do DJEN', to: '/publicacoes' },
    { key: 'contatos', label: 'Traga seus clientes (cadastro ou planilha)', to: '/contatos' },
    { key: 'documento', label: 'Envie um documento para a IA ler', to: '/documents' },
    { key: 'regra', label: 'Ligue sua primeira automação', to: '/automacao?aba=regras' },
    { key: 'perfil', label: 'Complete o perfil do escritório (áreas, cidade, assinatura)', to: '/aprovacoes' },
    { key: 'integracao', label: 'Conecte um app (e-mail, WhatsApp, Google Agenda…)', to: '/integracoes' },
];

const KEY = 'cadrius.onboarding.dismissed';

export function isDismissed() {
    try { return window.localStorage.getItem(KEY) === '1'; } catch { return false; }
}
export function dismiss() {
    try { window.localStorage.setItem(KEY, '1'); } catch { /* sem armazenamento: some só nesta sessão */ }
}

// Estado de cada passo a partir das respostas das APIs (função pura, testável)
export function computeSteps({ oabs, contacts, docs, rules, profile, connections } = {}) {
    const done = {
        oab: Array.isArray(oabs) && oabs.length > 0,
        contatos: Number(contacts?.total ?? contacts?.resultados?.length ?? 0) > 0,
        documento: Number(docs ?? 0) > 0,
        regra: Array.isArray(rules) && rules.some((r) => r.ativa),
        perfil: !!(profile && (profile.cidade || profile.assinatura)),
        integracao: Array.isArray(connections) ? connections.length > 0 : Number(connections?.length ?? 0) > 0,
    };
    const steps = STEPS.map((s) => ({ ...s, done: !!done[s.key] }));
    const count = steps.filter((s) => s.done).length;
    return { steps, done: count, total: steps.length, pct: Math.round((100 * count) / steps.length) };
}

const settle = (p) => p.then((v) => v, () => undefined);

export async function loadSteps(totalDocs) {
    const [oabs, contacts, rules, profile, connections] = await Promise.all([
        settle(api.get('publications/oabs/').then((r) => r.data)),
        settle(api.get('contacts/').then((r) => r.data)),
        settle(api.get('automations/rules/').then((r) => r.data)),
        settle(api.get('brain/profile/').then((r) => r.data)),
        settle(api.get('connections/').then((r) => r.data)),
    ]);
    return computeSteps({ oabs, contacts, docs: totalDocs, rules, profile, connections: connections?.results ?? connections });
}

// "Bom dia", "Boa tarde", "Boa noite" pelo horário local
export function greeting(date = new Date()) {
    const h = date.getHours();
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

export function todayLabel(date = new Date()) {
    const s = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    return s.charAt(0).toUpperCase() + s.slice(1);
}
