// Assinatura, trial e créditos avulsos (CAD-119). Contrato do back: billing/views.py e billing/serializers.py
import api, { API_ORIGIN } from './api';

const BASE = `${API_ORIGIN}/api/billing/`;

export async function getCurrentPlan() {
    const { data } = await api.get(`${BASE}plans/current/`);
    return data;
}

export async function getNotices() {
    const { data } = await api.get(`${BASE}notices/`);
    return data;
}

export async function validatePromo(planId, code) {
    const { data } = await api.post(`${BASE}promotions/validate/`, { plan_id: planId, code });
    return data;
}

// Cupom de dias extras de teste (CAD-224): aplica na hora, durante o período de teste.
export async function redeemPromo(code) {
    const { data } = await api.post(`${BASE}promotions/redeem/`, { code });
    return data;
}

export async function getCreditPacks() {
    const { data } = await api.get(`${BASE}credit-packs/`);
    return data;
}

export async function startCreditCheckout(packId) {
    const { data } = await api.post(`${BASE}credit-packs/checkout/`, { pack_id: packId });
    window.location.href = data.checkout_url;
}

// Assinatura de plano (com cupom opcional): abre o checkout do Stripe. O valor final é recalculado no servidor.
export async function startSubscriptionCheckout(planId, promoCode) {
    const body = { plan_id: planId };
    if (promoCode) body.promo_code = promoCode;
    const { data } = await api.post(`${BASE}checkout/`, body);
    window.location.href = data.checkout_url;
}

export function trialDaysLeft(assinatura, now = new Date()) {
    if (!assinatura?.trial_termina_em) return null;
    const ms = new Date(assinatura.trial_termina_em).getTime() - now.getTime();
    return Math.max(Math.ceil(ms / 86400000), 0);
}

// Mensagem (ou null) para o banner global, de acordo com o estado EFETIVO da assinatura calculado pelo back.
export function subscriptionNotice(assinatura, now = new Date()) {
    if (!assinatura) return null;
    switch (assinatura.estado) {
        case 'trialing': {
            const d = trialDaysLeft(assinatura, now);
            return { tone: 'info', text: `Período de teste: ${d} dia${d === 1 ? '' : 's'} restante${d === 1 ? '' : 's'} e ${assinatura.creditos_restantes ?? assinatura.creditos_mensais} de ${assinatura.creditos_mensais} créditos de IA. Assine para liberar todo o plano.` };
        }
        case 'past_due':
            return { tone: 'warn', text: 'Não conseguimos cobrar sua assinatura. Atualize o pagamento para não pausar a IA e as automações.' };
        case 'restricted':
        case 'suspended':
        case 'canceled':
            return { tone: 'danger', text: 'IA e automações pausadas por assinatura pendente. Seus dados continuam acessíveis; regularize o pagamento para voltar.' };
        default:
            return null;
    }
}

export function creditsNotice(assinatura) {
    if (!assinatura || !assinatura.ia_ativa) return null;
    // CAD-225: mostra o uso real do mês (antes só o total, parecia que nada era descontado)
    const used = assinatura.creditos_usados_mes;
    const base = used == null
        ? `${assinatura.creditos_mensais} créditos/mês`
        : `${used} de ${assinatura.creditos_mensais} créditos usados este mês`;
    return `${base}${assinatura.creditos_avulsos ? ` + ${assinatura.creditos_avulsos} avulsos disponíveis` : ''}`;
}

// CAD-231: adicional "Estúdio de mídia com IA" (imagem e vídeo no Marketing). Incluído no Enterprise.
export const mediaAddon = {
    status: () => api.get(`${BASE}addons/midia/`).then((r) => r.data),
    checkout: () => api.post(`${BASE}addons/midia/checkout/`).then((r) => { window.location.href = r.data.checkout_url; }),
    cancel: () => api.post(`${BASE}addons/midia/cancelar/`).then((r) => r.data),
};
