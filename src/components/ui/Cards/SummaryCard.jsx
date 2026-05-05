// src/components/dashboard/SummaryCard.jsx
import React from 'react';
import styles from './SummaryCard.module.css';

const SummaryCard = ({ title, value }) => {
    return (
        <div className={styles.card}>
            <span className={styles.title}>{title}</span>
            <h3 className={styles.value}>{value}</h3>
        </div>
    );
};

export default SummaryCard;