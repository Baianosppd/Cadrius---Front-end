// Assistente de IA (CAD-221). Contrato: assistant/api.py no back (/api/v1/assistant/).
import api from './api';

const BASE = 'assistant/';

export const assistantApi = {
    status: () => api.get(`${BASE}status/`).then((r) => r.data),
    list: () => api.get(`${BASE}conversations/`).then((r) => r.data),
    get: (id) => api.get(`${BASE}conversations/${id}/`).then((r) => r.data),
    start: (mensagem) => api.post(`${BASE}conversations/`, { mensagem }).then((r) => r.data),
    send: (id, mensagem) => api.post(`${BASE}conversations/${id}/`, { mensagem }).then((r) => r.data),
    remove: (id) => api.delete(`${BASE}conversations/${id}/`),
    decide: (actionId, decisao) => api.post(`${BASE}actions/${actionId}/decide/`, { decisao }).then((r) => r.data),
    write: (acao, texto, instrucoes = '') => api.post(`${BASE}write/`, { acao, texto, instrucoes }).then((r) => r.data),
};

export const WRITE_ACTIONS = [
    { key: 'corrigir', label: 'Corrigir português' },
    { key: 'formal', label: 'Deixar formal (peça)' },
    { key: 'simples', label: 'Linguagem simples (cliente)' },
    { key: 'resumir', label: 'Resumir em tópicos' },
    { key: 'email_cliente', label: 'Virar e-mail ao cliente' },
    { key: 'whatsapp', label: 'Virar mensagem de WhatsApp' },
    { key: 'extrair', label: 'Extrair dados (partes, prazos, valores)' },
];

export const SUGGESTIONS = [
    'Quais prazos vencem nesta semana?',
    'Resuma as publicações novas e diga o que fazer em cada uma.',
    'Calcule 15 dias úteis a partir de hoje.',
    'Crie uma tarefa para amanhã às 10h: revisar contrato da Maria.',
    'Escreva um e-mail ao cliente explicando que a audiência foi remarcada.',
];

export const PROVIDER_LABEL = {
    ANTHROPIC: 'Claude', OPENAI: 'OpenAI', GEMINI: 'Gemini', GROQ: 'Groq (Llama)', MISTRAL: 'Mistral',
    MARITACA: 'Sabiá', OPENROUTER: 'OpenRouter', OLLAMA: 'modelo local',
};

// Texto da IA em blocos seguros (sem HTML): títulos, listas, parágrafos; **negrito**, [texto](/rota) e /rotas internas.
export function parseBlocks(text) {
    const blocks = [];
    let list = null;
    for (const raw of String(text || '').split('\n')) {
        const line = raw.trimEnd();
        const bullet = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
        if (bullet) {
            const ordered = /^\s*\d/.test(line);
            if (!list || list.ordered !== ordered) {
                list = { type: 'list', ordered, items: [] };
                blocks.push(list);
            }
            list.items.push(bullet[1]);
            continue;
        }
        list = null;
        if (!line.trim()) continue;
        const heading = line.match(/^#{1,4}\s+(.*)$/);
        if (heading) blocks.push({ type: 'heading', text: heading[1] });
        else blocks.push({ type: 'p', text: line });
    }
    return blocks;
}

const INLINE = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((\/[^)\s]*)\)|(?<![\w/.])(\/(?:contatos|minutas|publicacoes|financas|documents|acompanhamento|agenda-forense|carteira|automacao|dashboard|marketing)(?:[/?][\w=&/-]*)?)/g;

export function parseInline(text) {
    const out = [];
    let last = 0;
    for (const m of String(text || '').matchAll(INLINE)) {
        if (m.index > last) out.push({ type: 'text', text: text.slice(last, m.index) });
        if (m[1]) out.push({ type: 'bold', text: m[1] });
        else if (m[2]) out.push({ type: 'link', text: m[2], to: m[3] });
        else out.push({ type: 'link', text: 'abrir', to: m[4] });
        last = m.index + m[0].length;
    }
    if (last < String(text || '').length) out.push({ type: 'text', text: text.slice(last) });
    return out;
}
