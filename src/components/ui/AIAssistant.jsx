import { useState } from 'react';
import styles from './AIAssistant.module.css';
import { FiSend } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api.js';

const AIAssistant = ({ onFillForm }) => {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            text: 'Olá! Sou seu assistente de IA da Cadrius. Posso ajudá-lo a criar tarefas de forma rápida e inteligente. Como posso ajudar você hoje?'
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
            const response = await api.post('/api/workflows/generate/', {
                prompt: input,
            });

            const data = response.data;

            // Se o back retornar dados para preencher o formulário
            if (data.formData) {
                onFillForm(data.formData);
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    text: data.message || 'Preenchi o formulário com as informações identificadas!'
                }]);
            } else {
                // Se retornar só uma mensagem de texto
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    text: data.message || 'Entendido! Como posso ajudar mais?'
                }]);
            }
        } catch (err) {
            toast.error('Falha de comunicação com o assistente IA. Tente novamente em instantes.');
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
                <div className={styles.header_icon}>✦</div>
                <div>
                    <h3 className={styles.title}>Assistente IA</h3>
                    <p className={styles.subtitle}>Peça para criar tarefas ou tire dúvidas</p>
                </div>
            </div>

            <div className={styles.messages}>
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`${styles.message} ${msg.role === 'user' ? styles.message_user : styles.message_assistant}`}
                    >
                        {msg.text}
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
                    placeholder="Ex: Crie uma tarefa para revisar..."
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

export default AIAssistant;