// src/components/dashboard/UrgentDeadlines.jsx
import React from 'react';
import styles from './UrgentDeadlines.module.css';

import Title from '../Title';

const DeadlineItem = ({ title, processNumber, date, timeLeft }) => (
    <div className={styles.deadline_card}>
        <div className={styles.info_side}>
            <h4 className={styles.deadline_title}>{title}</h4>
            <p className={styles.process_number}>Proc. {processNumber}</p>
        </div>
        <div className={styles.date_side}>
            <span className={styles.date_text}>{date}</span>
            <span className={styles.time_badge}>{timeLeft}</span>
        </div>
    </div>
);

const UrgentDeadlines = () => {
    return (
        <div className={styles.container}>
            <Title as="h2" className={styles.title}>Urgent Deadlines</Title>
            <div className={styles.list}>
                <DeadlineItem
                    title="Ordinary Appeal Filing"
                    processNumber="1234567-89.2025.8.26.0100"
                    date="07/03/2026"
                    timeLeft="48h left"
                />
            </div>
        </div>
    );
};

export default UrgentDeadlines;