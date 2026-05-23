// src/components/layout/QuickActions.js
import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import para navegação
import styles from './QuickActions.module.css';

function ActionButton({ title, color, icon, onClick }) {
    const buttonClass = styles[`button_bg_${color}`];

    return (
        <button className={`${styles.action_button} ${buttonClass}`} onClick={onClick}>
            <i data-feather={icon} className={styles.icon_style}></i>
            <span className={styles.button_text}>{title}</span>
        </button>
    );
}

function QuickActions() {
    const navigate = useNavigate();

    return (
        <div className={styles.actions_box}>
            <h3 className={styles.main_title}>Ações Rápidas</h3>

            <div className={styles.grid_container}>
                {/* Botão 1: Leva para criar automação */}
                <ActionButton
                    title="Nova Automação"
                    color="blue"
                    icon="plus-circle"
                    onClick={() => navigate('/automacao')}
                />

                {/* Botão 2: Leva para cadastrar conta (Integrações) */}
                <ActionButton
                    title="Conectar E-mail"
                    color="green"
                    icon="mail"
                    onClick={() => navigate('/integracoes')}
                />

                {/* Botão 3: Leva para lista de processos/prazos */}
                <ActionButton
                    title="Ver Prazos"
                    color="purple"
                    icon="clock"
                    onClick={() => navigate('/processos')}
                />

                {/* Botão 4: Configurações gerais */}
                <ActionButton
                    title="Configurações"
                    color="yellow"
                    icon="settings"
                    onClick={() => navigate('/perfil')}
                />
            </div>
        </div>
    );
}

export default QuickActions;