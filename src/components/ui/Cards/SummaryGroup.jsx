// src/components/dashboard/SummaryGroup.jsx
import React from 'react';
import styles from './SummaryGroup.module.css';

// Componente interno para evitar repetição de HTML
const StatBox = ({ title, value }) => (
    <div className={styles.stat_box}>
        <span className={styles.stat_title}>{title}</span>
        <h3 className={styles.stat_value}>{value}</h3>
    </div>
);

const SummaryGroup = ({ activeAutomations, totalExecutions, timeSaved }) => {
    return (
        <section className={styles.container}>
            <StatBox title="Active Automations" value={activeAutomations} />
            <StatBox title="Total Executions" value={totalExecutions} />
            <StatBox title="Time Saved" value={timeSaved} />
        </section>
    );
};

export default SummaryGroup;