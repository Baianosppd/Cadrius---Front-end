// src/components/layout/CredentialModal.js
import React, { useState } from 'react';
import api from '../../services/api';
import styles from './NewAutomationModal.module.css';

function CredentialModal({ isOpen, onClose, type, onSuccess }) {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        setLoading(true);
        try {
            // CORREÇÃO AQUI: Usamos toLocaleString() ou Date.now() para garantir nome único
            const uniqueName = `${type} Config - ${new Date().toLocaleString()}`;

            // Payload base
            const payload = {
                name: uniqueName,
                is_active: true
            };

            // Preenche os campos específicos baseados no tipo
            if (type === 'Telegram') {
                payload.telegram_bot_token = formData.token;
                payload.telegram_chat_id = formData.chat_id;
            } else if (type === 'Projuris') {
                payload.trello_api_key = formData.key;
                payload.trello_api_token = formData.token;
                payload.trello_list_id = formData.list_id;
            }

            await api.post('integration-configs/', payload);
            alert('Conectado com sucesso!');

            if (onSuccess) onSuccess(); // Atualiza a tela pai
            onClose();
        } catch (error) {
            console.error("Erro ao salvar credenciais:", error);
            // Mostra mensagem de erro específica se o backend enviar
            const msg = error.response?.data?.name
                ? "Já existe uma configuração com este nome."
                : "Erro ao salvar. Verifique os dados.";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal_box} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Conectar {type}</h2>
                    <button className={styles.close_button} onClick={onClose}>X</button>
                </div>

                <div className={styles.form_body}>
                    {type === 'Telegram' && (
                        <>
                            <div className={styles.form_group}>
                                <label className={styles.label}>Bot Token</label>
                                <input
                                    className={styles.input_field}
                                    placeholder="Ex: 123456:ABC-DEF1234..."
                                    onChange={e => setFormData({ ...formData, token: e.target.value })}
                                />
                            </div>
                            <div className={styles.form_group}>
                                <label className={styles.label}>Chat ID</label>
                                <input
                                    className={styles.input_field}
                                    placeholder="Ex: -100123456789"
                                    onChange={e => setFormData({ ...formData, chat_id: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    {type === 'Projuris' && (
                        <>
                            <div className={styles.form_group}>
                                <label className={styles.label}>API Key (Trello)</label>
                                <input
                                    className={styles.input_field}
                                    onChange={e => setFormData({ ...formData, key: e.target.value })}
                                />
                            </div>
                            <div className={styles.form_group}>
                                <label className={styles.label}>API Token</label>
                                <input
                                    className={styles.input_field}
                                    type="password"
                                    onChange={e => setFormData({ ...formData, token: e.target.value })}
                                />
                            </div>
                            <div className={styles.form_group}>
                                <label className={styles.label}>List ID (Coluna)</label>
                                <input
                                    className={styles.input_field}
                                    onChange={e => setFormData({ ...formData, list_id: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    <div className={styles.action_footer}>
                        <button className={styles.save_button} onClick={handleSave} disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar Conexão'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CredentialModal;