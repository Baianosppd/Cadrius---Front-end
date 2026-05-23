// src/components/integrations/IntegrationCard.jsx
import React from 'react';
import styles from './IntegrationCard.module.css';

const IntegrationCard = ({ name, type, description, status, Icon }) => {
    const isActive = status === 'active';

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.icon_wrapper}>
                    <Icon className={styles.brand_icon} />
                </div>
                {isActive && <span className={styles.active_badge}>Active</span>}
            </div>

            <div className={styles.content}>
                <h3 className={styles.brand_name}>{name}</h3>
                <span className={styles.brand_type}>{type}</span>
                <p className={styles.description}>{description}</p>
            </div>

            <div className={styles.footer}>
                <button
                    variant={isActive ? 'outline' : 'primary'}
                    className={isActive ? styles.btn_manage : styles.btn_connect}
                >
                    {isActive ? 'Manage Integration' : 'Connect'}
                </button>
            </div>
        </div>
    );
};

export default IntegrationCard;