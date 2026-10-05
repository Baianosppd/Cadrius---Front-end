// Quadro de contatos (CAD-171). Contrato: contacts/api.py no back (/api/v1/contacts/)
import api from './api';

export const contactsApi = {
    list: (params) => api.get('contacts/', { params }).then((r) => r.data),
    create: (body) => api.post('contacts/', body).then((r) => r.data),
    update: (id, body) => api.patch(`contacts/${id}/`, body).then((r) => r.data),
    remove: (id) => api.delete(`contacts/${id}/`),
};

export const KINDS = [
    ['cliente', 'Cliente'], ['parte_contraria', 'Parte contrária'], ['testemunha', 'Testemunha'], ['perito', 'Perito'],
    ['correspondente', 'Correspondente'], ['fornecedor', 'Fornecedor'], ['outro', 'Outro'],
];

export const EMPTY_CONTACT = {
    name: '', kind: 'cliente', document: '', email: '', phone: '', tags: [], notes: '',
    whatsapp_consent: false, email_consent: false, opted_out: false, consent_source: '',
};

// "vip, trabalhista ; vip" → ['trabalhista', 'vip']
export function parseTags(text) {
    return [...new Set(String(text || '').split(/[;,]/).map((t) => t.trim()).filter(Boolean))].sort();
}

// Corpo da API a partir do formulário: só manda a origem do consentimento quando algum consentimento mudou
export function contactBody(form, original = EMPTY_CONTACT) {
    const body = {
        name: form.name.trim(), kind: form.kind, document: form.document.trim(), email: form.email.trim(),
        phone: form.phone.trim(), tags: Array.isArray(form.tags) ? form.tags : parseTags(form.tags), notes: form.notes,
        whatsapp_consent: !!form.whatsapp_consent, email_consent: !!form.email_consent, opted_out: !!form.opted_out,
    };
    const consentChanged = ['whatsapp_consent', 'email_consent', 'opted_out'].some((k) => !!form[k] !== !!original[k]);
    if (consentChanged && form.consent_source?.trim()) body.consent_source = form.consent_source.trim();
    return body;
}

// 11988887777 → (11) 98888-7777
export function formatPhone(digits) {
    const d = String(digits || '').replace(/\D/g, '');
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return d;
}

export function channelStatus(c) {
    if (c.opted_out) return { label: 'Pediu para não receber', tone: 'red' };
    const ch = [c.can_whatsapp && 'WhatsApp', c.can_email && 'e-mail'].filter(Boolean);
    return ch.length ? { label: `Pode receber: ${ch.join(' e ')}`, tone: 'green' } : { label: 'Sem consentimento', tone: 'gray' };
}
