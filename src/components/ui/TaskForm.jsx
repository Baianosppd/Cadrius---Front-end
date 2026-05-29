import { useState } from 'react';
import styles from './TaskForm.module.css';

const TaskForm = ({ onCancel, onSubmit, formData, onFormDataChange }) => {
    const handleChange = (field, value) => {
        onFormDataChange({ ...formData, [field]: value });
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Criação Manual</h2>

            <div className={styles.field}>
                <label className={styles.label}>Título da Tarefa</label>
                <input
                    className={styles.input}
                    placeholder="Ex: Revisar contrato do cliente X"
                    value={formData.titulo || ''}
                    onChange={(e) => handleChange('titulo', e.target.value)}
                />
            </div>

            <div className={styles.field}>
                <label className={styles.label}>Descrição</label>
                <textarea
                    className={styles.textarea}
                    placeholder="Descreva os detalhes da tarefa..."
                    value={formData.descricao || ''}
                    onChange={(e) => handleChange('descricao', e.target.value)}
                />
            </div>

            <div className={styles.fields_row}>
                <div className={styles.field}>
                    <label className={styles.label}>Data e Horário</label>
                    <input
                        className={styles.input}
                        type="datetime-local"
                        value={formData.dataHorario || ''}
                        onChange={(e) => handleChange('dataHorario', e.target.value)}
                    />
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>Prioridade</label>
                    <select
                        className={styles.select}
                        value={formData.prioridade || 'media'}
                        onChange={(e) => handleChange('prioridade', e.target.value)}
                    >
                        <option value="alta">Alta</option>
                        <option value="media">Média</option>
                        <option value="baixa">Baixa</option>
                    </select>
                </div>
            </div>

            <div className={styles.field}>
                <label className={styles.label}>Responsável</label>
                <select
                    className={styles.select}
                    value={formData.responsavel || ''}
                    onChange={(e) => handleChange('responsavel', e.target.value)}
                >
                    <option value="joao">João Silva</option>
                    <option value="maria">Maria Santos</option>
                    <option value="pedro">Pedro Costa</option>
                    <option value="ana">Ana Oliveira</option>
                </select>
            </div>

            <div className={styles.divider} />

            <div className={styles.toggle_row}>
                <div className={styles.toggle_info}>
                    <p className={styles.toggle_title}>Sincronizar com Calendário</p>
                    <span className={styles.toggle_subtitle}>Vincule esta tarefa ao Google Calendar ou Outlook</span>
                </div>
                <button
                    className={`${styles.toggle} ${formData.sincronizar ? styles.toggle_active : styles.toggle_inactive}`}
                    onClick={() => handleChange('sincronizar', !formData.sincronizar)}
                    type="button"
                >
                    <span className={`${styles.toggle_thumb} ${formData.sincronizar ? styles.thumb_active : styles.thumb_inactive}`} />
                </button>
            </div>

            <div className={styles.footer}>
                <button className={styles.cancel_button} onClick={onCancel}>
                    Cancelar
                </button>
                <button className={styles.submit_button} onClick={() => onSubmit(formData)}>
                    Criar Tarefa
                </button>
            </div>
        </div>
    );
};

export default TaskForm;