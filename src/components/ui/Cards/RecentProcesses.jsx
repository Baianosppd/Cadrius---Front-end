// src/components/dashboard/RecentProcesses.jsx
import React from 'react';
import styles from './RecentProcesses.module.css';

import Title from '../Title';

// Componente auxiliar interno para cada processo
const ProcessItem = ({ number, caseName, status, statusInfo, statusColor }) => (
    <div className={styles.process_item}>
        <div className={styles.process_info}>
            <h4 className={styles.process_number}>Process {number}</h4>
            <p className={styles.process_case}>Case: {caseName}</p>
        </div>
        <div className={styles.process_status_wrapper}>
            <span className={styles.status_dot} style={{ backgroundColor: statusColor }}></span>
            <div className={styles.status_text_wrapper}>
                <p className={styles.status_title}>{status}</p>
                <span className={styles.status_info}>{statusInfo}</span>
            </div>
        </div>
    </div>
);

const RecentProcesses = () => {
    // Dados de exemplo traduzidos
    const processes = [
        {
            id: 1,
            number: '1234567',
            caseName: 'Theft',
            status: 'Upcoming Deadline - Tomorrow at 2 PM',
            statusInfo: 'New movement: Petition Joined',
            statusColor: '#ef4444'
        },
        {
            id: 2,
            number: '1234567',
            caseName: 'Inmate',
            status: 'Alert',
            statusInfo: 'New notification',
            statusColor: '#f59e0b'
        },
    ];

    return (
        <div className={styles.container}>
            <Title as="h2" className={styles.title}>Recent Processes</Title>

            <div className={styles.process_list}>
                {processes.map(process => (
                    <ProcessItem key={process.id} {...process} />
                ))}
            </div>

            <div className={styles.footer}>
                <button className={styles.btn_view_all}>View All Processes</button>
            </div>
        </div>
    );
};

export default RecentProcesses;