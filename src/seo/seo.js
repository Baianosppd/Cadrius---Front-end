// SEO por rota: título, descrição, canonical e robots.
// Só as telas públicas de produção são indexáveis; telas logadas, links com token e o ambiente de teste ficam fora do Google.
// O nginx reforça a mesma regra com o cabeçalho X-Robots-Tag (nginx/default.conf.template).

export const SITE_URL = 'https://app.cadrius.ia.br';
export const PROD_HOST = 'app.cadrius.ia.br';
export const SITE_NAME = 'Cadrius';

const DEFAULT_DESCRIPTION =
    'Cadrius é a plataforma de gestão jurídica com IA para advogados e escritórios: publicações do DJEN, '
    + 'prazos em dias úteis, leitura de documentos com IA e dados protegidos pela LGPD.';

// Páginas públicas (entram no sitemap.xml e podem aparecer na busca).
export const PUBLIC_PAGES = {
    '/': {
        title: 'Cadrius — Gestão jurídica com IA para advogados e escritórios',
        description: 'Entre no Cadrius: publicações do DJEN, prazos em dias úteis, documentos lidos pela IA com revisão do '
            + 'advogado e dados cifrados com trilha de auditoria (LGPD).',
    },
    '/criar-conta': {
        title: 'Criar conta no Cadrius — Software jurídico com IA',
        description: 'Crie sua conta no Cadrius como advogado autônomo ou escritório. Publicações, prazos, documentos e '
            + 'clientes em um só lugar, com a IA trabalhando e você no controle.',
    },
    '/cadastro/individual': {
        title: 'Cadastro de advogado autônomo — Cadrius',
        description: 'Cadastre-se como advogado autônomo no Cadrius: publicações e prazos da sua OAB e leitura de '
            + 'documentos com IA, em poucos minutos.',
    },
    '/cadastro/empresa': {
        title: 'Cadastro de escritório de advocacia — Cadrius',
        description: 'Cadastre seu escritório no Cadrius: equipe com perfis de acesso, carteira de clientes, honorários, '
            + 'portal do cliente e auditoria conforme a LGPD.',
    },
    '/esqueceu-a-senha': {
        title: 'Recuperar senha — Cadrius',
        description: 'Recupere o acesso à sua conta Cadrius: enviamos um link seguro para o seu e-mail.',
        sitemap: false,
    },
};

// Títulos das telas logadas (aparecem na aba do navegador; nunca indexadas).
const PRIVATE_TITLES = [
    ['/dashboard', 'Painel'], ['/documents', 'Documentos'], ['/processos', 'Processos'], ['/automacao', 'Automação'],
    ['/editor', 'Editor de fluxos'], ['/equipe', 'Equipe'], ['/integracoes', 'Integrações'],
    ['/notificacoes', 'Notificações'], ['/perfil', 'Perfil'], ['/newtask', 'Nova tarefa'], ['/privacidade', 'Privacidade'],
    ['/ia', 'IA segura'], ['/aprovacoes', 'Central de aprovações'], ['/contatos', 'Contatos'], ['/importar', 'Importar'],
    ['/suporte', 'Suporte'], ['/agenda-forense', 'Agenda forense'], ['/acompanhamento', 'Acompanhamento'],
    ['/publicacoes', 'Publicações'], ['/minutas', 'Minutas'], ['/marketing', 'Marketing'], ['/carteira', 'Carteira'],
    ['/financas', 'Finanças'], ['/assistente', 'Assistente'], ['/relogio', 'Relógio de voz'], ['/plugins', 'Plugins'],
    ['/auditoria', 'Auditoria'], ['/gestao', 'Gestão Cadrius'], ['/portal', 'Portal do cliente'],
    ['/captacao', 'Formulário'], ['/whatsapp', 'Conectar WhatsApp'], ['/pesquisa', 'Pesquisa de satisfação'],
    ['/redefinir-senha', 'Criar nova senha'], ['/trocar-senha', 'Trocar senha'], ['/google/callback', 'Entrando'],
];

export function normalizePath(pathname = '/') {
    const p = pathname.replace(/\/{2,}/g, '/');
    return p.length > 1 ? p.replace(/\/+$/, '') : '/';
}

export function seoFor(pathname, host) {
    const path = normalizePath(pathname);
    const page = PUBLIC_PAGES[path];
    const indexable = Boolean(page) && host === PROD_HOST;
    if (page) {
        return { title: page.title, description: page.description, canonical: `${SITE_URL}${path === '/' ? '/' : path}`, robots: indexable ? 'index, follow' : 'noindex, nofollow' };
    }
    const hit = PRIVATE_TITLES.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`));
    return { title: hit ? `${hit[1]} — ${SITE_NAME}` : SITE_NAME, description: DEFAULT_DESCRIPTION, canonical: null, robots: 'noindex, nofollow' };
}

export function sitemapPaths() {
    return Object.entries(PUBLIC_PAGES).filter(([, p]) => p.sitemap !== false).map(([path]) => path);
}
