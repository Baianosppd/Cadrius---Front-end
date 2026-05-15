// src/components/dashboard/AutomationActionCard.jsx
import React from 'react';
import styles from './AutomationActionCard.module.css';

const AutomationActionCard = ({ lawyerName, lawyerEmail, avatarUrl, aiSummary, recommendation }) => {
    return (
        <div className={styles.card_container}>
            <div className={styles.user_header}>
                <img src={avatarUrl} alt={lawyerName} className={styles.avatar} />
                <div className={styles.user_info}>
                    <h4>{lawyerName}</h4>
                    <span>{lawyerEmail}</span>
                </div>
            </div>

            <div className={styles.ai_summary_box}>
                <h5>Resumo IA</h5>
                <p>{aiSummary}</p>
            </div>

            <div className={styles.recommendation_box}>
                <h5>Proximos passos recomendados</h5>
                <p>{recommendation}</p>
            </div>

            <div className={styles.actions}>
                <button className={styles.btn_primary}>Action Required &rarr;</button>
                <button variant="outline" className={styles.btn_secondary}>View Details &rarr;</button>
            </div>
        </div>
    );
};

export default AutomationActionCard;