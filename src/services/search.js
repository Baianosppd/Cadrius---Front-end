// Busca global / paleta de comandos (CAD-220). Ctrl+K (ou Cmd+K) em qualquer tela: telas do menu, ações rápidas e
// registros do escritório (contatos, processos, documentos). Atalho de teclado = eficiência para quem usa todo dia (H7).
import api from './api';
import { APP_MENU, HELP_ITEM } from '../layouts/appMenu';

export const OPEN_EVENT = 'cadrius:command-palette';

export const ACTIONS = [
    { id: 'a-assistente', label: 'Perguntar ao assistente IA', hint: 'Assistente', to: '/assistente', keywords: 'ia chat perguntar escrever corrigir resumir' },
    { id: 'a-estrategia', label: 'Montar estratégia de um caso', hint: 'Assistente', to: '/assistente', keywords: 'tese caso estrategia plano' },
    { id: 'a-conector', label: 'Ligar o Cadrius no Claude ou ChatGPT', hint: 'Plugins', to: '/plugins', keywords: 'mcp conector claude chatgpt pro token' },
    { id: 'a-contato', label: 'Novo contato', hint: 'Contatos', to: '/contatos?novo=1', keywords: 'cliente cadastrar pessoa' },
    { id: 'a-oportunidade', label: 'Nova oportunidade no funil', hint: 'Carteira', to: '/carteira', keywords: 'lead captação cliente novo' },
    { id: 'a-minuta', label: 'Nova minuta', hint: 'Minutas', to: '/minutas?nova=1', keywords: 'peça petição rascunho' },
    { id: 'a-documento', label: 'Enviar documento para a IA ler', hint: 'Documentos', to: '/documents', keywords: 'upload pdf intimação' },
    { id: 'a-oab', label: 'Cadastrar OAB no DJEN', hint: 'Publicações', to: '/publicacoes', keywords: 'intimação diário' },
    { id: 'a-prazo', label: 'Calcular prazo em dias úteis', hint: 'Agenda forense', to: '/agenda-forense', keywords: 'feriado recesso contagem' },
    { id: 'a-conteudo', label: 'Criar conteúdo de marketing', hint: 'Marketing', to: '/marketing', keywords: 'post instagram linkedin' },
    { id: 'a-despesa', label: 'Lançar despesa ou custas', hint: 'Finanças', to: '/financas', keywords: 'custas gasto reembolso' },
    { id: 'a-chamado', label: 'Falar com o suporte', hint: 'Ajuda', to: '/suporte', keywords: 'ajuda dúvida chamado' },
];

export function norm(text) {
    return String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

// Itens fixos: telas do menu (respeitando o perfil) + ações rápidas
export function staticItems(isOrgManager = false) {
    const pages = APP_MENU.flatMap((s) => s.items.filter((i) => !i.managersOnly || isOrgManager)
        .map((i) => ({ id: `p-${i.to}`, group: 'Telas', label: i.label, hint: s.section, to: i.to, icon: i.icon })));
    pages.push({ id: `p-${HELP_ITEM.to}`, group: 'Telas', label: HELP_ITEM.label, hint: 'Ajuda', to: HELP_ITEM.to, icon: HELP_ITEM.icon });
    return [...pages, ...ACTIONS.map((a) => ({ ...a, group: 'Ações rápidas' }))];
}

// Pontuação simples: começo da palavra vale mais que meio; todas as palavras digitadas precisam aparecer
export function score(item, query) {
    const q = norm(query);
    if (!q) return 1;
    const label = norm(item.label);
    const hay = `${label} ${norm(item.hint)} ${norm(item.keywords)}`;
    const words = q.split(/\s+/);
    if (!words.every((w) => hay.includes(w))) return 0;
    let s = 1;
    if (label.startsWith(q)) s += 4;
    if (label.split(/\s+/).some((w) => w.startsWith(words[0]))) s += 2;
    if (label.includes(q)) s += 1;
    return s;
}

export function filterItems(items, query, limit = 8) {
    return items.map((it) => ({ it, s: score(it, query) })).filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.it);
}

// Busca nos registros do escritório (só com 2+ caracteres). Cada fonte falha sozinha sem derrubar as outras.
export async function searchRemote(query) {
    const q = String(query || '').trim();
    if (q.length < 2) return [];
    const safe = (p) => p.then((v) => v, () => null);
    const [contacts, cases, docs] = await Promise.all([
        safe(api.get('contacts/', { params: { q } }).then((r) => r.data)),
        safe(api.get('research/cases/').then((r) => r.data)),
        safe(api.get('documentos/', { params: { q } }).then((r) => r.data)),
    ]);
    const out = [];
    for (const c of (contacts?.resultados || []).slice(0, 5)) {
        out.push({ id: `c-${c.id}`, group: 'Contatos', label: c.name, hint: c.kind_label || 'Contato', to: `/contatos?abrir=${c.id}` });
    }
    const nq = norm(q).replace(/\D/g, '');
    for (const k of (Array.isArray(cases) ? cases : cases?.resultados || [])) {
        const hit = norm(`${k.cnj} ${k.label || ''} ${k.cliente?.nome || ''}`);
        if (hit.includes(norm(q)) || (nq.length >= 4 && String(k.cnj || '').replace(/\D/g, '').includes(nq))) {
            out.push({ id: `k-${k.id}`, group: 'Processos', label: k.cnj, hint: k.label || k.cliente?.nome || 'Processo acompanhado', to: '/acompanhamento' });
        }
        if (out.filter((o) => o.group === 'Processos').length >= 5) break;
    }
    for (const d of (docs?.results || docs?.resultados || (Array.isArray(docs) ? docs : [])).slice(0, 5)) {
        out.push({ id: `d-${d.id}`, group: 'Documentos', label: d.nome || d.file_name || d.name || d.title || `Documento ${d.id}`, hint: d.cliente || d.client_name || 'Documento', to: `/documents/${d.id}` });
    }
    return out;
}

// Últimos itens abertos pela paleta (só no navegador)
const RECENT = 'cadrius.palette.recent';
export function recent() {
    try { return JSON.parse(window.localStorage.getItem(RECENT) || '[]').slice(0, 5); } catch { return []; }
}
export function remember(item) {
    try {
        const list = [{ id: item.ref || item.id, label: item.label, hint: item.hint, to: item.to, group: 'Recentes' }, ...recent().filter((r) => r.id !== item.id)];
        window.localStorage.setItem(RECENT, JSON.stringify(list.slice(0, 5)));
    } catch { /* sem armazenamento */ }
}

export function openPalette() {
    window.dispatchEvent(new Event(OPEN_EVENT));
}
