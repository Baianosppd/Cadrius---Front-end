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
        // CAD-226: imagem real do post (modo 'ia' ou 'marca')
        image: (id, body) => api.post(`${base}conteudos/${id}/imagem/`, body).then((r) => r.data),
        // CAD-231: fotos do escritório (todos os planos) e vídeo com IA (adicional de mídia)
        photos: () => api.get(`${base}fotos/`).then((r) => r.data),
        uploadPhoto: (file) => {
            const fd = new FormData();
            fd.append('arquivo', file);
            return api.post(`${base}fotos/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
        },
        removePhoto: (id) => api.delete(`${base}fotos/${id}/`),
        video: (id) => api.get(`${base}conteudos/${id}/video/`).then((r) => r.data),
        startVideo: (id, body) => api.post(`${base}conteudos/${id}/video/`, body).then((r) => r.data),
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

// Cores de cada canal (identificação rápida na agenda e no calendário)
export const CHANNEL_COLOR = {
    instagram: '#e1306c', facebook: '#1877f2', linkedin: '#0a66c2', blog: '#64748b', google_business: '#34a853', newsletter: '#f59e0b', video_curto: '#7c3aed',
};

// Grade do mês (semanas de domingo a sábado) com os conteúdos de cada dia: [[{date, iso, inMonth, items}], …]
export function monthGrid(year, month, items = []) {
    const first = new Date(year, month, 1);
    const start = new Date(year, month, 1 - first.getDay());
    const byDay = new Map();
    for (const it of items) {
        if (!it.agendado_para) continue;
        const d = new Date(it.agendado_para);
        const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (!byDay.has(k)) byDay.set(k, []);
        byDay.get(k).push(it);
    }
    const weeks = [];
    for (let w = 0; w < 6; w += 1) {
        const week = [];
        for (let i = 0; i < 7; i += 1) {
            const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + i);
            week.push({ date: d, day: d.getDate(), inMonth: d.getMonth() === month, items: byDay.get(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`) || [] });
        }
        if (w >= 4 && week.every((c) => !c.inMonth)) break;
        weeks.push(week);
    }
    return weeks;
}

// CAD-226: de onde veio a imagem do post
export const IMAGE_SOURCE = { openai: 'IA (OpenAI)', gemini: 'IA (Gemini)', marca: 'Arte pronta', foto: 'Foto do escritório' };

// CAD-231: modelos de arte pronta (sem IA, todos os planos). "foto" usa uma foto do escritório como fundo.
export const ART_STYLES = [
    ['destaque', 'Destaque', 'Título grande na cor da marca'],
    ['citacao', 'Citação', 'Frase em destaque, fundo claro'],
    ['dica', 'Dica', 'Faixa "Dica" e texto direto'],
    ['foto', 'Com foto', 'Sua foto com o título por cima'],
];
export const MAX_REFS = 3;
