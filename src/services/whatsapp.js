// WhatsApp hospedado pelo Cadrius (CAD-225): conectar com QR code ou código de pareamento, sem servidor próprio.
import api, { API_ORIGIN } from './api';

export const whatsappApi = {
    status: () => api.get('integrations/whatsapp/').then((r) => r.data),
    connect: (numero) => api.post('integrations/whatsapp/conectar/', { numero }).then((r) => r.data),
    link: (numero) => api.post('integrations/whatsapp/link/', { numero }).then((r) => r.data),
    disconnect: () => api.post('integrations/whatsapp/desconectar/'),
    publicPair: (token) => api.get(`${API_ORIGIN}/api/v1/publico/whatsapp/${encodeURIComponent(token)}/`).then((r) => r.data),
};

// Código de pareamento no formato que o WhatsApp mostra: ABCD-1234
export const formatPairingCode = (code) => {
    const c = String(code || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
    return c.length === 8 ? `${c.slice(0, 4)}-${c.slice(4)}` : c;
};

export const PAIRING_STEPS = [
    'Abra o WhatsApp no celular do escritório.',
    'Toque em ⋮ (Android) ou Configurações (iPhone) → Aparelhos conectados → Conectar um aparelho.',
    'Toque em "Conectar com número de telefone" e digite o código abaixo.',
];
