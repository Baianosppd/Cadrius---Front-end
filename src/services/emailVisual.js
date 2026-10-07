// E-mail profissional (CAD-226): assinatura de cada pessoa, visual do escritório e prévia. Contrato: integrations/api_email.py
import api from './api';

const BASE = 'integrations/email/';

export const emailApi = {
    signature: () => api.get(`${BASE}assinatura/`).then((r) => r.data),
    saveSignature: (body) => api.put(`${BASE}assinatura/`, body).then((r) => r.data),
    visual: () => api.get(`${BASE}visual/`).then((r) => r.data),
    saveVisual: (body) => api.put(`${BASE}visual/`, body).then((r) => r.data),
    preview: (body) => api.post(`${BASE}previa/`, body).then((r) => r.data),
};

export const MAX_SIGNATURE_IMAGE = 200 * 1024;

// Lê a imagem escolhida como data URL, conferindo tipo e tamanho antes de enviar
export function readSignatureImage(file) {
    return new Promise((resolve, reject) => {
        if (!file) { resolve(''); return; }
        if (!['image/png', 'image/jpeg'].includes(file.type)) { reject(new Error('Use uma imagem PNG ou JPG.')); return; }
        if (file.size > MAX_SIGNATURE_IMAGE) { reject(new Error('A imagem deve ter até 200 KB.')); return; }
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
        r.readAsDataURL(file);
    });
}

// Visuais do e-mail (iguais a integrations/email_layout.py; vazio = padrão do escritório)
export const VISUAL_OPTIONS = [
    ['', 'Padrão do escritório'], ['moderno', 'Moderno (faixa com a cor do escritório)'],
    ['classico', 'Clássico (sóbrio, com serifa)'], ['simples', 'Simples (só texto e assinatura)'],
];
