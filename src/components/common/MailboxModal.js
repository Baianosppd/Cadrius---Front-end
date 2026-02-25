// src/components/layout/MailboxModal.js
import React, { useState } from 'react';
import api from '../../services/api';
import styles from './NewAutomationModal.module.css'; // Reutilizando estilos

function MailboxModal({ isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        imap_host: 'imap.gmail.com',
        imap_port: 993,
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!formData.username || !formData.password || !formData.name) {
            alert("Preencha os campos obrigatórios.");
            return;
        }

        setLoading(true);
        try {
            // Endpoint documentado no item 3.2 do relatório
            await api.post('mailboxes/', {
                ...formData,
                is_active: true
            });
            alert('Caixa de e-mail conectada com sucesso!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Erro ao salvar Mailbox:", error);
            alert("Erro ao conectar. Verifique as credenciais e se o IMAP está habilitado.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal_box} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Conectar Nova Caixa de E-mail</h2>
                    <button className={styles.close_button} onClick={onClose}>X</button>
                </div>

                <div className={styles.form_body}>
                    <div className={styles.form_group}>
                        <label className={styles.label}>Nome da Caixa (Identificador)</label>
                        <input
                            className={styles.input_field}
                            placeholder="Ex: Gmail Jurídico"
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4" style={{ display: 'flex', gap: '1rem' }}>
                        <div className={styles.form_group} style={{ flex: 2 }}>
                            <label className={styles.label}>Host IMAP</label>
                            <input
                                className={styles.input_field}
                                value={formData.imap_host}
                                onChange={e => setFormData({ ...formData, imap_host: e.target.value })}
                            />
                        </div>
                        <div className={styles.form_group} style={{ flex: 1 }}>
                            <label className={styles.label}>Porta</label>
                            <input
                                className={styles.input_field}
                                type="number"
                                value={formData.imap_port}
                                onChange={e => setFormData({ ...formData, imap_port: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className={styles.form_group}>
                        <label className={styles.label}>E-mail (Usuário)</label>
                        <input
                            className={styles.input_field}
                            type="email"
                            placeholder="seu.email@exemplo.com"
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>

                    <div className={styles.form_group}>
                        <label className={styles.label}>Senha de Aplicativo</label>
                        <input
                            className={styles.input_field}
                            type="password"
                            placeholder="Senha gerada (App Password)"
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                        <small style={{ color: '#6B7280' }}>Para Gmail, use a Senha de App (não a senha de login).</small>
                    </div>

                    <div className={styles.action_footer}>
                        <button className={styles.save_button} onClick={handleSave} disabled={loading}>
                            {loading ? 'Testando Conexão...' : 'Salvar e Conectar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MailboxModal;