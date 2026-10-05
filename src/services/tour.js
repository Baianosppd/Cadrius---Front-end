// Tour curto na primeira entrada de cada módulo grande (CAD-220). Até 3 passos, sem bloquear a tela: um cartão no canto
// que explica para que serve o módulo e qual é a primeira ação. Visto uma vez por navegador; "Pular" encerra (H10).
export const TOURS = {
    '/publicacoes': {
        title: 'Publicações',
        steps: [
            'Cadastre a OAB de cada advogado: o Cadrius busca as intimações no DJEN todos os dias.',
            'Cada publicação chega com resumo da IA e o prazo calculado em dias úteis.',
            'Marque como revisada ou gere a minuta da resposta direto daqui.',
        ],
    },
    '/minutas': {
        title: 'Minutas',
        steps: [
            'Uma minuta nasce de uma publicação, de um documento ou de um modelo do escritório.',
            'A IA escreve o rascunho; você revisa, ajusta e aprova. Nada sai sem a sua revisão.',
        ],
    },
    '/automacao': {
        title: 'Automações',
        steps: [
            'Regras do tipo "quando acontecer X, faça Y" (avisar cliente, criar tarefa, mandar e-mail).',
            'Toda regra nasce desligada: teste com o simulador e ligue quando estiver confiante.',
        ],
    },
    '/carteira': {
        title: 'Carteira de clientes',
        steps: [
            'O funil mostra cada oportunidade, do primeiro contato até o contrato assinado.',
            'Ao fechar o contrato de honorários, as parcelas vão sozinhas para Finanças.',
        ],
    },
    '/financas': {
        title: 'Finanças',
        steps: [
            'Recebíveis, despesas e custas do escritório num só lugar.',
            'Dê baixa nas parcelas pagas e acompanhe o que está para vencer.',
        ],
    },
    '/marketing': {
        title: 'Marketing',
        steps: [
            'Crie conteúdo com a IA dentro das regras do Provimento 205 da OAB.',
            'Veja como o post aparece em cada rede antes de publicar.',
            'Organize tudo no calendário editorial do mês.',
        ],
    },
    '/aprovacoes': {
        title: 'IA do escritório',
        steps: [
            'Aqui a IA aprende o jeito do escritório: áreas, cidade, assinatura e estilo de escrita.',
            'Revise e aprove o que ela propõe; só o que você aprovar passa a valer.',
        ],
    },
};

const KEY = 'cadrius.tour.seen';

export function tourFor(pathname) {
    const path = String(pathname || '').replace(/\/+$/, '') || '/';
    return Object.prototype.hasOwnProperty.call(TOURS, path) ? { key: path, ...TOURS[path] } : null;
}

export function seenTours() {
    try {
        const v = JSON.parse(window.localStorage.getItem(KEY) || '[]');
        return Array.isArray(v) ? v : [];
    } catch { return []; }
}

export function markSeen(key) {
    try { window.localStorage.setItem(KEY, JSON.stringify([...new Set([...seenTours(), key])])); } catch { /* sem armazenamento */ }
}

export function shouldShow(pathname) {
    const t = tourFor(pathname);
    return t && !seenTours().includes(t.key) ? t : null;
}
