// src/components/dashboard/AutomationSummary.jsx
import React from 'react';
import styles from './AutomationSummary.module.css';

import Title from '../Title';

const AutomationSummary = () => {
    const stats = [
        { label: 'Completed', value: '01' },
        { label: 'Terminated', value: '04' },
        { label: 'Pending', value: '03' },
        { label: 'Overdue', value: '01' }
    ];

    return (
        <div className={styles.container}>
            <Title as="h2" className={styles.title}>Resumo das automações</Title>
            <div className={styles.stats_grid}>
                {stats.map((item, index) => (
                    <div key={index} className={styles.stat_item}>
                        <span className={styles.stat_value}>{item.value}</span>
                        <span className={styles.stat_label}>{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AutomationSummary;