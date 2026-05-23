// src/components/pages/Comunicacao.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import styles from './Comunicacao.module.css';
import StatusBadge from '../../components/ui/StatusBadge';
import TextoCarregando from '../../components/ui/TextoCarregando';




// Componente para um item na lista de E-mails/Comunicação
function CommunicationItem({ type, title, subtitle, time, status, onAction }) {

    const isEmail = type === 'email';
    const icon = isEmail ? 'mail' : 'send';
    const iconColorClass = isEmail ? styles.icon_mail : styles.icon_telegram; // Você pode criar styles.icon_telegram se quiser variar a cor

    return (
        <div className={styles.item_card}>
            <div className={styles.item_header}>
                {/* Ícone dinâmico */}
                <i data-feather={icon} className={`${styles.icon_base} ${iconColorClass}`}></i>

                <div className={styles.item_info}>
                    <p className={styles.sender}>{title}</p>
                    <p className={styles.subject}>{subtitle}</p>
                </div>
            </div>

            <div className={styles.meta_info}>
                <span className={styles.time}>{time}</span>

                {!isEmail && (
                    <StatusBadge
                        status={status}
                        text={status === 'SUCCESS' ? 'Enviado' : 'Falha'}
                    />
                )}
            </div>


            <div className={styles.item_actions}>
                {isEmail ? (
                    <>
                        <button className={styles.action_button_default}>Responder</button>
                        <button className={styles.action_button_primary} onClick={onAction}>
                            <i data-feather="zap" className={styles.icon_zap}></i>
                            Criar Automação
                        </button>
                    </>
                ) : (
                    <button className={styles.action_button_default}>Ver Detalhes</button>
                )}
            </div>
        </div>
    );
}

function Comunicacao() {
    const [activeTab, setActiveTab] = useState('email');
    const [emails, setEmails] = useState([]);
    const [telegramLogs, setTelegramLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Busca dados da API
    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const response = await api.get('emails/');
                const data = response.data.results || response.data;

                setEmails(data);

                // Processa os logs de Telegram a partir dos e-mails
                // Extrai todos os logs de todos os emails e filtra apenas TELEGRAM
                const logs = data.flatMap(email => {
                    if (!email.integration_logs_ext) return [];

                    return email.integration_logs_ext
                        .filter(log => log.service_display.includes('Telegram') || log.service_display.includes('TELEGRAM'))
                        .map(log => ({
                            ...log,
                            original_email_subject: email.subject, // Anexa o assunto do email original para contexto
                            original_email_sender: email.sender
                        }));
                });

                // Ordena por data (mais recente primeiro)
                logs.sort((a, b) => new Date(b.attempted_at) - new Date(a.attempted_at));

                setTelegramLogs(logs);

            } catch (error) {
                console.error("Erro ao carregar comunicações:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    // Re-executa o replace dos ícones Feather quando a aba ou os dados mudam
    useEffect(() => {
        if (window.feather) window.feather.replace();
    }, [activeTab, emails, telegramLogs]);

    return (
        <div className={styles.comunicacao_container}>

            <div className={styles.main_box}>

                {/* Cabeçalho (Abas e Status) */}
                <div className={styles.header}>
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab_button} ${activeTab === 'email' ? styles.tab_active : styles.tab_inactive}`}
                            onClick={() => setActiveTab('email')}
                        >
                            E-mail
                            <span className={styles.counter_badge}>{emails.length}</span>
                        </button>
                        <button
                            className={`${styles.tab_button} ${activeTab === 'telegram' ? styles.tab_active : styles.tab_inactive}`}
                            onClick={() => setActiveTab('telegram')}
                        >
                            Telegram
                            <span className={styles.counter_badge}>{telegramLogs.length}</span>
                        </button>
                    </div>

                    <div className={styles.status_indicators}>
                        <span className={styles.status_item}>
                            <span className={`${styles.status_dot} ${styles.dot_green}`}></span> E-mail Conectado
                        </span>
                        <span className={styles.status_item}>
                            <span className={`${styles.status_dot} ${telegramLogs.length > 0 ? styles.dot_green : styles.dot_gray}`}></span> Telegram {telegramLogs.length > 0 ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                </div>

                {/* Conteúdo da Lista */}
                <div className={styles.tab_content}>

                    {loading ? (
                        <TextoCarregando text={'Carregando Mensagens...'}></TextoCarregando>
                    ) : (
                        <>
                            {/* Lista de E-mails */}
                            {
                                activeTab === 'email' && (
                                    <div className={styles.email_list}>
                                        {emails.length === 0 ? (
                                            <p className={styles.empty_state}>Nenhum e-mail encontrado.</p>
                                        ) : (
                                            emails.map(email => (
                                                <CommunicationItem
                                                    key={email.id}
                                                    type="email"
                                                    title={email.sender}
                                                    subtitle={email.subject}
                                                    time={new Date(email.received_at).toLocaleString('pt-BR')}
                                                    onAction={() => alert(`Criar automação para: ${email.subject}`)}
                                                />
                                            ))
                                        )}
                                    </div>
                                )
                            }

                            {/* Lista de Telegram */}
                            {activeTab === 'telegram' && (
                                <div className={styles.telegram_content}>
                                    {telegramLogs.length === 0 ? (
                                        <p className={styles.empty_state}>Nenhuma notificação de Telegram enviada ainda.</p>
                                    ) : (
                                        telegramLogs.map(log => (
                                            <CommunicationItem
                                                key={log.id}
                                                type="telegram"
                                                title="Cadrius Bot (Enviado)"
                                                subtitle={`Ref: ${log.original_email_subject}`}
                                                time={new Date(log.attempted_at).toLocaleString('pt-BR')}
                                                status={log.status}
                                            />
                                        ))
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div >
    );
}

export default Comunicacao;