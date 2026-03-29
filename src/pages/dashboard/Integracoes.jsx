// src/components/pages/Integracoes.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import styles from './Integracoes.module.css';

// Importação de todos os Modais de Configuração
import CredentialModal from '../../components/common/CredentialModal';
import MailboxModal from '../../components/common/MailboxModal';
import AIProfileModal from '../../components/common/AIProfileModal';


// Componente Visual do Card
function IntegrationCard({ name, status, iconSrc, info, connectText, onConnect }) {
    // Verifica se está conectado/ativo para mudar o estilo visual
    const isConnected = status === 'Conectado' || status === 'Ativo';
    const buttonStyle = isConnected ? styles.button_green : styles.button_blue;

    return (
        <div className={styles.integration_card}>
            <div className={styles.icon_wrapper}>
                {iconSrc ? (
                    <img src={iconSrc} alt={`${name} Logo`} className={styles.icon_img} />
                ) : (
                    <div className={styles.icon_placeholder}>
                        <i data-feather="settings" className={styles.icon_settings}></i>
                    </div>

                )}
            </div>

            <h3 className={styles.name}>{name}</h3>
            <p className={styles.info}>{info || '.'}</p>

            <button
                className={`${styles.status_button} ${buttonStyle}`}
                onClick={onConnect}
            >
                {/* Se já estiver conectado, o botão serve para "Gerenciar" ou "Adicionar Mais" */}
                {isConnected ? 'Gerenciar / Adicionar' : connectText}
            </button>
        </div>
    );
}

function Integracoes() {
    // Estado para controlar qual modal está aberto
    const [modalType, setModalType] = useState(null);

    // Estado para armazenar o status real vindo do Backend
    const [statusData, setStatusData] = useState({
        email: { connected: false, count: 0 },
        telegram: { connected: false, active: false },
        trello: { connected: false, active: false },
        ai_profiles: { count: 0 },
        drive: { connected: false }
    });

    // Função que consulta a API e atualiza os status na tela
    const checkIntegrations = async () => {
        try {
            // Faz todas as chamadas necessárias em paralelo
            const [mailRes, configRes, aiRes] = await Promise.all([
                api.get('mailboxes/'),           // Checa se tem e-mail cadastrado
                api.get('integration-configs/'), // Checa chaves de Telegram/Trello
                api.get('extraction-profiles/')  // Checa perfis de IA
            ]);

            const mailboxes = mailRes.data.results || mailRes.data;
            const configs = configRes.data.results || configRes.data;
            const profiles = aiRes.data.results || aiRes.data;

            // Verifica se existem configurações específicas salvas
            const telegramConfig = configs.find(c => c.telegram_bot_token);
            const trelloConfig = configs.find(c => c.trello_api_key);

            // Atualiza o estado da tela
            setStatusData({
                email: {
                    connected: mailboxes.length > 0,
                    count: mailboxes.length
                },
                telegram: {
                    connected: !!telegramConfig,
                    active: telegramConfig?.is_active
                },
                trello: {
                    connected: !!trelloConfig,
                    active: trelloConfig?.is_active
                },
                ai_profiles: {
                    count: profiles.length
                },
                drive: { connected: false } // Placeholder para futuro
            });

        } catch (error) {
            console.error("Erro ao verificar integrações:", error);
        }
    };

    // Carrega os dados ao abrir a tela
    useEffect(() => {
        checkIntegrations();
    }, []);

    // Garante que os ícones Feather (se usados) sejam renderizados
    useEffect(() => {
        if (window.feather) window.feather.replace();
    });

    return (
        <div className={styles.integracoes_container}>

            <div className={styles.intro_text}>
                <p>🤖 Configure suas conexões externas para que as Automações possam utilizá-las.</p>
            </div>

            <div className={styles.integracoes_grid}>

                {/* 1. E-mail (Abre MailboxModal) */}
                <IntegrationCard
                    name="E-mail (IMAP)"
                    status={statusData.email.connected ? "Conectado" : "Desconectado"}
                    iconSrc="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg"
                    info={statusData.email.connected ? `${statusData.email.count} caixa(s) configurada(s)` : "Nenhuma caixa configurada"}
                    connectText="Conectar Conta"
                    onConnect={() => setModalType('Mailbox')}
                />

                {/* 2. Telegram (Abre CredentialModal tipo Telegram) */}
                <IntegrationCard
                    name="Telegram"
                    status={statusData.telegram.connected ? "Conectado" : "Desconectado"}
                    iconSrc="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg"
                    info={statusData.telegram.connected ? "Bot ativo para notificações" : "Token não configurado"}
                    connectText="Configurar"
                    onConnect={() => setModalType('Telegram')}
                />

                {/* 3. Projuris / Trello (Abre CredentialModal tipo Projuris) */}
                <IntegrationCard
                    name="Projuris (Trello)"
                    status={statusData.trello.connected ? "Conectado" : "Desconectado"}
                    iconSrc={null}
                    info={statusData.trello.connected ? "Integração ativa" : "Credenciais ausentes"}
                    connectText="Conectar"
                    onConnect={() => setModalType('Projuris')}
                />

                {/* 4. Perfis de IA (Abre AIProfileModal) */}
                <IntegrationCard
                    name="Cérebro IA"
                    status={statusData.ai_profiles.count > 0 ? "Ativo" : "Padrão"}
                    iconSrc="https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/1024px-ChatGPT_logo.svg.png"
                    info={`${statusData.ai_profiles.count} prompts configurados`}
                    connectText="Criar Novo Prompt"
                    onConnect={() => setModalType('AI')}
                />

                {/* 5. Google Drive (Placeholder) */}
                <IntegrationCard
                    name="Google Drive"
                    status="Desconectado"
                    iconSrc="https://upload.wikimedia.org/wikipedia/commons/d/da/Google_Drive_logo.png"
                    info="Armazenamento de anexos"
                    connectText="Em Breve"
                    onConnect={() => alert("Integração em desenvolvimento.")}
                />
            </div>

            {/* --- ÁREA DOS MODAIS --- */}

            {/* Modal para Telegram e Projuris */}
            <CredentialModal
                isOpen={modalType === 'Telegram' || modalType === 'Projuris'}
                type={modalType}
                onClose={() => setModalType(null)}
                onSuccess={checkIntegrations} // Recarrega status após salvar
            />

            {/* Modal para E-mail */}
            <MailboxModal
                isOpen={modalType === 'Mailbox'}
                onClose={() => setModalType(null)}
                onSuccess={checkIntegrations} // Recarrega status após salvar
            />

            {/* Modal para Perfis de IA */}
            <AIProfileModal
                isOpen={modalType === 'AI'}
                onClose={() => setModalType(null)}
                onSuccess={checkIntegrations} // Recarrega status após salvar
            />
        </div>
    );
}

export default Integracoes;