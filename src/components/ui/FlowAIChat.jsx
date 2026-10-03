import { useState } from 'react';
import styles from './FlowAIChat.module.css';
import { FiSend } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api.js';

const suggestions = [
    { label: 'Notificar prazo', description: 'Notificar cliente 3 dias antes do prazo', time: '~3 min' },
    { label: 'Criar Tarefa no Projuris', description: 'Novo processo → criar tarefa automática', time: '~2 min' },
    { label: 'Sincronizar E-mails', description: 'Anexos de e-mail → Google Drive', time: '~4 min' },
];

const FlowAIChat = ({ onWorkflow }) => {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            text: 'Olá! 👋 Sou o assistente de automações do Cadrius. Posso ajudá-lo a criar e otimizar seus fluxos de trabalho.\n\nAnalisei seus processos e tenho algumas sugestões de automação que podem economizar tempo:',
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // A IA gera a estrutura (gatilho + ações). Nada é salvo: você revisa no canvas e clica em Salvar.
            const { data } = await api.post('workflows/generate-from-prompt/', { prompt: userMessage.text });
            onWorkflow(data);
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: `Montei “${data.workflow_name}” no canvas. Revise os blocos, escolha a conexão do gatilho e salve.`,
            }]);
        } catch (err) {
            const code = err.response?.data?.code;
            const msg = err.response?.status === 428 ? 'Aceite os termos atualizados para continuar.'
                : err.response?.status === 422 ? 'Não consegui montar um fluxo válido. Descreva com mais detalhes (o que dispara e o que deve acontecer).'
                : code === 'quota_exceeded' ? 'O limite de créditos de IA do plano foi atingido.'
                : err.response?.data?.detail || 'Falha de comunicação com o assistente IA. Tente novamente em instantes.';
            setMessages(prev => [...prev, { role: 'assistant', text: msg }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.header_icon}>🤖</div>
                <div>
                    <h3 className={styles.title}>Assistente IA</h3>
                    <div className={styles.online}>
                        <span className={styles.online_dot} />
                        Online
                    </div>
                </div>
            </div>

            <div className={styles.messages}>
                {messages.map((msg, index) => (
                    <div key={index} className={`${styles.message} ${msg.role === 'user' ? styles.message_user : styles.message_assistant}`}>
                        {msg.role === 'assistant' && index === 0 ? (
                            <>
                                <p className={styles.message_text}>{msg.text}</p>
                                <div className={styles.suggestions}>
                                    {suggestions.map((s, i) => (
                                        <div key={i} className={styles.suggestion_item}>
                                            <div className={styles.suggestion_left}>
                                                <p className={styles.suggestion_label}>{s.label}</p>
                                                <span className={styles.suggestion_description}>{s.description}</span>
                                            </div>
                                            <span className={styles.suggestion_time}>{s.time}</span>
                                        </div>
                                    ))}
                                    <div className={styles.suggestion_hint}>
                                        💡 Clique em uma sugestão para adicioná-la ao fluxo, ou descreva sua automação no chat abaixo.
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className={styles.message_text}>{msg.text}</p>
                        )}
                    </div>
                ))}
                {loading && (
                    <div className={`${styles.message} ${styles.message_assistant}`}>
                        <span className={styles.loading_dots}>...</span>
                    </div>
                )}
            </div>

            <div className={styles.input_row}>
                <input
                    className={styles.input}
                    placeholder="Descreva uma automação..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                />
                <button
                    className={styles.send_button}
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                >
                    <FiSend className={styles.send_icon} />
                </button>
            </div>
        </div>
    );
};

export default FlowAIChat;