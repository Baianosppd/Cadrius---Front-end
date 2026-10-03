// Catálogo das conexões suportadas pelo back (AppConnection.APP_CHOICES) e dos campos de credencial de cada uma.
// As credenciais são SOMENTE ESCRITA: depois de salvas, o back nunca as devolve.
export const CONNECTION_APPS = {
    WHATSAPP: {
        label: 'WhatsApp (Evolution API)', description: 'Envio de mensagens aos clientes',
        fields: [
            { key: 'instance_name', label: 'Nome da instância', required: true },
            { key: 'api_key', label: 'Chave da API', secret: true, required: true },
            { key: 'base_url', label: 'URL do servidor (opcional)', placeholder: 'https://wpp.seudominio.com' },
        ],
    },
    TELEGRAM: {
        label: 'Telegram', description: 'Notificações por bot',
        fields: [
            { key: 'telegram_bot_token', label: 'Token do bot', secret: true, required: true },
            { key: 'telegram_chat_id', label: 'ID do chat', required: true },
        ],
    },
    TRELLO: {
        label: 'Trello', description: 'Cartões a partir das automações',
        fields: [
            { key: 'trello_api_key', label: 'API key', secret: true, required: true },
            { key: 'trello_api_token', label: 'Token', secret: true, required: true },
            { key: 'trello_list_id', label: 'ID da lista', required: true },
        ],
    },
    CLICKUP: { label: 'ClickUp', description: 'Tarefas a partir das automações', fields: [{ key: 'token', label: 'Token pessoal', secret: true, required: true }] },
    SHEETS: { label: 'Google Sheets', description: 'Planilhas', fields: [{ key: 'token', label: 'Token de acesso', secret: true, required: true }] },
    ASTREA: { label: 'Astrea', description: 'Consulta processual', fields: [{ key: 'token', label: 'Token', secret: true, required: true }] },
    WEBHOOK: { label: 'Webhook customizado', description: 'Receber eventos de sistemas externos', fields: [] },
};
