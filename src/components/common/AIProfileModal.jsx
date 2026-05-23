// src/components/layout/AIProfileModal.js
import React, { useState } from 'react';
import api from '../../services/api.js';
import styles from './NewAutomationModal.module.css';

function AIProfileModal({ isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        pydantic_schema_name: 'ProcessoJuridicoSchema', // Valor padrão
        system_prompt_template: ''
    });
    const [loading, setLoading] = useState(false);

    // Schemas disponíveis no backend (extraction/schemas.py)
    const schemas = [
        { value: 'ProcessoJuridicoSchema', label: 'Processo Jurídico (Número, Prazo, Movimentação)' },
        { value: 'ServiceOrderSchema', label: 'Pedido de Serviço (Cliente, SLA, Descrição)' },
        { value: 'SupportRequestSchema', label: 'Suporte Técnico (Bug, Sistema, Criticidade)' }
    ];

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!formData.name || !formData.system_prompt_template) {
            alert("Preencha todos os campos.");
            return;
        }

        setLoading(true);
        try {
            // Endpoint documentado no item 5.2
            await api.post('extraction-profiles/', formData);
            alert('Perfil de IA criado com sucesso!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Erro ao criar perfil:", error);
            alert("Erro ao criar perfil de IA.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal_box} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Novo Perfil de Inteligência (Prompt)</h2>
                    <button className={styles.close_button} onClick={onClose}>X</button>
                </div>

                <div className={styles.form_body}>
                    <div className={styles.form_group}>
                        <label className={styles.label}>Nome do Perfil</label>
                        <input
                            className={styles.input_field}
                            placeholder="Ex: Extrator de Intimações Trabalhistas"
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className={styles.form_group}>
                        <label className={styles.label}>Tipo de Documento (Schema)</label>
                        <select
                            className={styles.select_field}
                            value={formData.pydantic_schema_name}
                            onChange={e => setFormData({ ...formData, pydantic_schema_name: e.target.value })}
                        >
                            {schemas.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.form_group}>
                        <label className={styles.label}>Prompt do Sistema (Instruções para a IA)</label>
                        <textarea
                            className={styles.input_field}
                            style={{ minHeight: '150px' }}
                            placeholder="Ex: Você é um assistente jurídico. Analise o texto e extraia prazos fatais. A data de hoje é {data_atual}..."
                            onChange={e => setFormData({ ...formData, system_prompt_template: e.target.value })}
                        />
                        <small style={{ color: '#6B7280' }}>Dica: Use <strong>{`{data_atual}`}</strong> para injetar a data de hoje.</small>
                    </div>

                    <div className={styles.action_footer}>
                        <button className={styles.save_button} onClick={handleSave} disabled={loading}>
                            {loading ? 'Salvando...' : 'Criar Perfil'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AIProfileModal;