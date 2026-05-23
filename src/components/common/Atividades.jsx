// src/components/layout/Atividades.js
import React, { useEffect } from 'react';
import styles from './Atividades.module.css';
import { useNavigate } from 'react-router-dom';

function AtividadeItem({ title, description, time, color, icon }) {
    const iconContainerClass = styles[`icon_container_${color}`];

    return (
        <div className={styles.atividade_item}>
            <div className={`${styles.icon_wrapper} ${iconContainerClass}`}>
                <i data-feather={icon} className={styles.icon_style}></i>
            </div>
            <div className={styles.text_content}>
                <p className={styles.title}>{title}</p>
                <p className={styles.description}>{description}</p>
                <p className={styles.time}>{time}</p>
            </div>
        </div>
    );
}

function Atividades({ data = [] }) {
    const navigate = useNavigate();

    // Garante que os ícones carreguem ao atualizar a lista
    useEffect(() => {
        if (window.feather) window.feather.replace();
    });

    return (
        <div className={styles.atividades_box}>

            <div className={styles.header}>
                <h3 className={styles.main_title}>Atividades Recentes</h3>
                <button className={styles.view_all_btn} onClick={() => navigate('/processos')}>Ver tudo</button>
            </div>

            <div className={styles.list_container}>
                {data.length === 0 ? (
                    <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '1rem' }}>
                        Nenhuma atividade recente.
                    </p>
                ) : (
                    data.map((item, index) => (
                        <AtividadeItem
                            key={index}
                            title={item.title}
                            description={item.description}
                            time={item.time}
                            color={item.color}
                            icon={item.icon}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

export default Atividades;