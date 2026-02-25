// src/components/layout/NewAutomationModal.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import styles from './NewAutomationModal.module.css';

function NewAutomationModal({ isOpen, onClose }) {
    const [mailboxes, setMailboxes] = useState([]);
    const [profiles, setProfiles] = useState([]); // Perfis de IA (Prompts)

    // Estado do Formulário
    const [formData, setFormData] = useState({
        name: '',
        mailbox: '',
        subject_contains: '',
        extraction_profile: '' // O ID do prompt da IA
    });

    // Carrega as opções (Mailboxes e Perfis de IA) ao abrir
    useEffect(() => {
        if (isOpen) {
            api.get('mailboxes/').then(res => setMailboxes(res.data.results || res.data));
            api.get('extraction-profiles/').then(res => setProfiles(res.data.results || res.data));
        }
    }, [isOpen]);

    const handleSave = async () => {
        try {
            // Validação simples
            if (!formData.mailbox || !formData.extraction_profile || !formData.name) {
                alert("Preencha os campos obrigatórios.");
                return;
            }

            await api.post('automation-rules/', {
                ...formData,
                priority: 10, // Valor padrão
                is_active: true
            });

            alert("Automação criada com sucesso!");
            onClose();
            window.location.reload(); // Ou passar uma função de callback para atualizar a lista
        } catch (error) {
            console.error("Erro ao criar automação:", error);
            alert("Erro ao salvar. Verifique os dados.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal_box} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Nova Automação Inteligente</h2>
                    <button className={styles.close_button} onClick={onClose}><i data-feather="x"></i>X</button>
                </div>

                <div className={styles.form_body}>
                    {/* Nome da Regra */}
                    <div className={styles.form_group}>
                        <label className={styles.label}>Nome da Regra</label>
                        <input
                            className={styles.input_field}
                            placeholder="Ex: Processar Intimações Urgentes"
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    {/* Seleção da Caixa de Entrada */}
                    <div className={styles.form_group}>
                        <label className={styles.label}>Monitorar a Caixa:</label>
                        <select
                            className={styles.select_field}
                            onChange={e => setFormData({ ...formData, mailbox: e.target.value })}
                        >
                            <option value="">Selecione um e-mail...</option>
                            {mailboxes.map(mb => (
                                <option key={mb.id} value={mb.id}>{mb.name} ({mb.username})</option>
                            ))}
                        </select>
                    </div>

                    {/* Condição (Filtro) */}
                    <div className={styles.form_group}>
                        <label className={styles.label}>Se o Assunto contiver:</label>
                        <input
                            className={styles.input_field}
                            placeholder="Ex: intimação, urgente, despacho"
                            onChange={e => setFormData({ ...formData, subject_contains: e.target.value })}
                        />
                    </div>

                    {/* Seleção do Perfil de IA (Prompt) */}
                    <div className={styles.form_group}>
                        <label className={styles.label}>Usar este Perfil de IA (Prompt):</label>
                        <select
                            className={styles.select_field}
                            onChange={e => setFormData({ ...formData, extraction_profile: e.target.value })}
                        >
                            <option value="">Selecione a inteligência...</option>
                            {profiles.map(profile => (
                                <option key={profile.id} value={profile.id}>
                                    {profile.name} (Schema: {profile.pydantic_schema_name})
                                </option>
                            ))}
                        </select>
                        <small style={{ color: '#6B7280', marginTop: '4px', display: 'block' }}>
                            Isso define quais dados (prazos, valores, nomes) a IA vai extrair.
                        </small>
                    </div>

                    <div className={styles.action_footer}>
                        <button className={styles.save_button} onClick={handleSave}>Salvar Automação</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NewAutomationModal;