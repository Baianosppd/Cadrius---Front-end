// src/components/layout/SimulationModal.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import styles from './NewAutomationModal.module.css'; // Reutiliza o estilo do outro modal

function SimulationModal({ isOpen, onClose }) {
    const [mailboxes, setMailboxes] = useState([]);
    const [formData, setFormData] = useState({
        mailbox_id: '',
        subject: '',
        body: ''
    });
    const [loading, setLoading] = useState(false);

    // Carrega as caixas de e-mail ao abrir
    useEffect(() => {
        if (isOpen) {
            api.get('mailboxes/').then(res => {
                const data = res.data.results || res.data;
                setMailboxes(data);
                // Seleciona a primeira caixa por padrão
                if (data.length > 0) {
                    setFormData(prev => ({ ...prev, mailbox_id: data[0].id }));
                }
            });
        }
    }, [isOpen]);

    const handleSimulate = async () => {
        if (!formData.mailbox_id || !formData.subject || !formData.body) {
            alert("Preencha todos os campos para simular.");
            return;
        }

        setLoading(true);
        try {
            // Chama o endpoint de simulação que já existe no seu backend
            await api.post('emails/simulate/', formData);
            alert('✅ E-mail simulado injetado!\n\nO sistema vai processá-lo agora. Verifique a tela de "Processos" ou "Comunicação" em alguns segundos.');
            onClose();
        } catch (error) {
            console.error("Erro na simulação:", error);
            alert("Erro ao simular e-mail. Verifique se o backend está rodando.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal_box} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title} style={{ color: '#7C3AED' }}>⚡ Simular Recebimento</h2>
                    <button className={styles.close_button} onClick={onClose}>X</button>
                </div>

                <div className={styles.form_body}>
                    <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1rem' }}>
                        Teste suas regras injetando um e-mail falso diretamente no sistema.
                    </p>

                    {/* Seleção da Caixa */}
                    <div className={styles.form_group}>
                        <label className={styles.label}>Caixa de Destino</label>
                        <select
                            className={styles.select_field}
                            value={formData.mailbox_id}
                            onChange={e => setFormData({ ...formData, mailbox_id: e.target.value })}
                        >
                            {mailboxes.length === 0 && <option>Nenhuma caixa cadastrada</option>}
                            {mailboxes.map(mb => (
                                <option key={mb.id} value={mb.id}>{mb.name} ({mb.username})</option>
                            ))}
                        </select>
                    </div>

                    {/* Assunto */}
                    <div className={styles.form_group}>
                        <label className={styles.label}>Assunto (Teste o Gatilho)</label>
                        <input
                            className={styles.input_field}
                            placeholder="Ex: URGENTE - Intimação Processo 123"
                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                        />
                        <small style={{ color: '#6B7280' }}>Use palavras-chave que você definiu nas suas regras.</small>
                    </div>

                    {/* Corpo do E-mail */}
                    <div className={styles.form_group}>
                        <label className={styles.label}>Corpo do E-mail (Para a IA extrair)</label>
                        <textarea
                            className={styles.input_field}
                            style={{ minHeight: '120px', fontFamily: 'monospace' }}
                            placeholder="Cole aqui o texto do e-mail..."
                            onChange={e => setFormData({ ...formData, body: e.target.value })}
                        />
                    </div>

                    <div className={styles.action_footer}>
                        <button
                            className={styles.save_button}
                            style={{ backgroundColor: '#7C3AED' }} // Roxo para diferenciar
                            onClick={handleSimulate}
                            disabled={loading}
                        >
                            {loading ? 'Processando...' : 'Disparar Simulação'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SimulationModal;