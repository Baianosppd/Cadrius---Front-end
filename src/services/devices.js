// Relógio e voz (CAD-227). Contrato: automations/api.py (aparelhos) e automations/voice.py (comandos)
import api from './api';

export const devicesApi = {
    list: () => api.get('automations/aparelhos/').then((r) => r.data),
    create: (body) => api.post('automations/aparelhos/', body).then((r) => r.data),
    remove: (id) => api.delete(`automations/aparelhos/${id}/`),
    test: (texto, aparelhoId) => api.post('automations/aparelhos/testar/', { texto, aparelho_id: aparelhoId }).then((r) => r.data),
};

export const VOICE_COMMANDS = [
    { dizer: 'Pendências', faz: 'Lista até 3 envios aguardando aprovação, cada um com um código de 4 dígitos.' },
    { dizer: 'Aprovar 4821 / Recusar 4821', faz: 'Decide aquele envio (só em aparelho com permissão de aprovar).' },
    { dizer: 'Agenda de hoje', faz: 'Tarefas de hoje e prazos dos próximos 2 dias.' },
    { dizer: 'Lembrete ligar para a Maria amanhã', faz: 'Cria a tarefa para você (hoje na próxima hora ou amanhã às 9h).' },
    { dizer: 'Cheguei ao fórum', faz: 'Roda a regra de Atalho que tem essa frase (Automações → Regras).' },
    { dizer: 'Ajuda', faz: 'Lembra o que dá para dizer.' },
];

export const QUICK_TRIES = ['pendências', 'agenda de hoje', 'lembrete ligar para o cliente amanhã'];

// Passo a passo por aparelho. {url} = link de voz; {avisos} = tópico de avisos (ntfy)
export const DEVICE_GUIDES = {
    apple: { titulo: 'Apple Watch e iPhone (Siri)', passos: [
        'No iPhone, abra o app Atalhos → + → nome "Cadrius" (é o que você vai dizer à Siri: "E aí Siri, Cadrius").',
        'Adicione "Ditar texto" (idioma português).',
        'Adicione "Obter conteúdo de URL": cole o link de voz, método POST, corpo JSON com o campo texto = Texto ditado.',
        'Adicione "Obter valor do dicionário" (chave fala) e "Falar texto" (ou "Mostrar resultado").',
        'Em detalhes do atalho, ligue "Mostrar no Apple Watch". No relógio: toque no atalho ou fale com a Siri.',
        'Para aprovar: diga "pendências", ouça o código e diga "aprovar" e o código.',
    ] },
    wear: { titulo: 'Android e Wear OS', passos: [
        'Instale o app gratuito "HTTP Shortcuts".',
        'Crie um atalho: método POST, cole o link de voz, corpo JSON {"texto": "{texto}"} e peça o texto por voz antes de enviar.',
        'Em "Resposta", escolha mostrar ou falar o campo fala.',
        'Adicione o atalho como bloco (tile) no relógio Wear OS ou na tela inicial.',
    ] },
    alexa: { titulo: 'Alexa', passos: [
        'No IFTTT, crie um applet: "Se eu disser à Alexa: cheguei ao fórum" (ou use uma Rotina da Alexa com o IFTTT).',
        'Ação: Webhooks → Make a web request: cole o link de voz, POST, application/json, corpo {"texto": "cheguei ao fórum"}.',
        'A Alexa dispara, mas não lê a resposta: use para atalhos e lembretes, e aprove pelo relógio ou celular.',
    ] },
    google: { titulo: 'Google Assistente', passos: [
        'No celular Android, crie o atalho no "HTTP Shortcuts" e diga "Ok Google, abrir Cadrius" (o nome do atalho).',
        'Ou use Rotinas do Google Home com o IFTTT/Home Assistant chamando o link de voz.',
    ] },
    outro: { titulo: 'Botão, NFC ou automação', passos: [
        'Botões inteligentes (Flic, Shelly) e etiquetas NFC do iPhone chamam o link de voz com um texto fixo, ex.: {"texto": "cheguei ao fórum"}.',
        'Home Assistant, n8n ou Make: chame o mesmo link e leia o campo fala.',
    ] },
};

export const NOTIFY_GUIDE = [
    'Instale o app gratuito "ntfy" no celular (iPhone ou Android). As notificações aparecem no relógio pareado.',
    'Toque em + e assine o tópico abaixo (é secreto: não compartilhe).',
    'Quando um envio esperar aprovação, chega o aviso com o código e os botões Aprovar e Recusar (no Android/Wear OS os botões funcionam direto no relógio; no iPhone, toque no aviso).',
];
