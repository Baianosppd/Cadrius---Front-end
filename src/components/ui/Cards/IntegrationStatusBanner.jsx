// src/components/dashboard/IntegrationStatusBanner.jsx
import React from 'react';
import styles from './IntegrationStatusBanner.module.css';

const IntegrationStatusBanner = ({ connectedCount, totalCount }) => {
    return (
        <div className={styles.banner_container}>
            <div className={styles.info_section}>
                <h3 className={styles.title}>Connected Integrations</h3>
                <p className={styles.subtitle}>
                    You have {connectedCount} active integration working for you.
                </p>
            </div>

            <div className={styles.metric_section}>
                <span className={styles.current_number}>
                    {connectedCount < 10 ? `0${connectedCount}` : connectedCount}
                </span>
                <span className={styles.total_label}>
                    of {totalCount} apps
                </span>
            </div>
        </div>
    );
};

export default IntegrationStatusBanner;