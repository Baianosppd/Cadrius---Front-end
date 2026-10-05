// Marketing (CAD-174): mesmo motor para o escritório (/marketing/) e para a Cadrius (/backoffice/marketing/). Contrato: marketing/api.py
import api from './api';

export function makeMarketingApi(base) {
    return {
        ideas: () => api.get(`${base}ideias/`).then((r) => r.data),
        check: (texto, canal) => api.post(`${base}verificar/`, { texto, canal }).then((r) => r.data),
        list: (params) => api.get(`${base}conteudos/`, { params }).then((r) => r.data),
        get: (id) => api.get(`${base}conteudos/${id}/`).then((r) => r.data),
        generate: (body) => api.post(`${base}conteudos/`, body).then((r) => r.data),
        update: (id, body) => api.patch(`${base}conteudos/${id}/`, body).then((r) => r.data),
        remove: (id) => api.delete(`${base}conteudos/${id}/`),
        publish: (id) => api.post(`${base}conteudos/${id}/publicar/`).then((r) => r.data),
        campaigns: () => api.get(`${base}campanhas/`).then((r) => r.data),
        addCampaign: (body) => api.post(`${base}campanhas/`, body).then((r) => r.data),
        removeCampaign: (id) => api.delete(`${base}campanhas/${id}/`),
        growth: () => api.get(`${base}crescimento/`).then((r) => r.data),
    };
}

export const officeMarketingApi = makeMarketingApi('marketing/');
export const cadriusMarketingApi = makeMarketingApi('backoffice/marketing/');

export const CHANNELS = [
    ['instagram', 'Instagram'], ['facebook', 'Facebook'], ['linkedin', 'LinkedIn'], ['blog', 'Blog / site'],
    ['google_business', 'Perfil no Google'], ['newsletter', 'Newsletter (e-mail)'], ['video_curto', 'Vídeo curto (Reels/Shorts)'],
];
export const CHANNEL_LABEL = Object.fromEntries(CHANNELS);
export const STATUS = {
    rascunho: ['Rascunho', 'gray'], aprovado: ['Aprovado', 'blue'], agendado: ['Agendado', 'yellow'], publicado: ['Publicado', 'green'], falhou: ['Falhou', 'red'],
};
export const LEVEL_TONE = { alto: 'red', medio: 'orange', baixo: 'gray' };
export const AUTO_CHANNELS = ['facebook', 'instagram'];

// "#direito, cdc  ; #lgpd" → ['direito', 'cdc', 'lgpd']
export function parseHashtags(text) {
    return [...new Set(String(text || '').split(/[\s,;]+/).map((t) => t.replace(/^#+/, '').trim()).filter(Boolean))].slice(0, 8);
}

// Data ISO → valor de <input type="datetime-local"> no fuso do navegador
export function toLocalInput(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Agrupa por dia (agendados) para a agenda editorial; sem data vão para "Sem data"
export function groupByDay(items) {
    const groups = new Map();
    for (const it of items) {
        const key = it.agendado_para ? new Date(it.agendado_para).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }) : 'Sem data';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(it);
    }
    return [...groups.entries()].sort(([a], [b]) => (a === 'Sem data') - (b === 'Sem data'));
}
