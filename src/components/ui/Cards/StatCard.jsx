// src/components/dashboard/EstatisticasRapidas.jsx
import React from 'react';
import { FiMail, FiClipboard, FiCalendar, FiFileText } from 'react-icons/fi';
import styles from './StatCard.module.css';

import Title from '../Title';

// Componente auxiliar interno para cada sub-card
const StatCard = ({ Icone, numero, descricao }) => (
    <div className={styles.stat_card}>
        <Icone className={styles.stat_icon} />
        <h3 className={styles.stat_number}>{numero}</h3>
        <p className={styles.stat_description}>{descricao}</p>
    </div>
);

const StatsCard = () => {
    return (
        <div className={styles.container}>
            <Title as="h2" className={styles.title}>Estatísticas Rápidas</Title>

            <div className={styles.stats_grid}>
                <StatCard
                    Icone={FiMail}
                    numero="120"
                    descricao="Emails analisados pela IA"
                />
                <StatCard
                    Icone={FiClipboard}
                    numero="14"
                    descricao="Tarefas criadas"
                />
                <StatCard
                    Icone={FiCalendar}
                    numero="6"
                    descricao="Prazos ativos"
                />
                <StatCard
                    Icone={FiFileText}
                    numero="32"
                    descricao="Docs processados"
                />
            </div>
        </div>
    );
};

export default StatsCard;