// src/components/integrations/IntegrationGroup.jsx
import React from 'react';
// Ajustado: SiMicrosoft no lugar de SiMicrosoftoutlook
import { SiGmail } from 'react-icons/si';
import IntegrationCard from './IntegrationCard';
import styles from './IntegrationGroup.module.css';

const IntegrationGroup = () => {
    const integrations = [
        {
            id: 1,
            name: 'Gmail',
            type: 'EMAIL',
            description: 'Sync your legal emails for AI analysis and automatic case opening.',
            status: 'active',
            Icon: SiGmail
        },
        {
            id: 2,
            name: 'Microsoft Outlook',
            type: 'EMAIL',
            description: 'Connect your Outlook inbox to centralize all legal correspondence.',
            status: 'idle',
            Icon: SiGmail
        },
        {
            id: 3,
            name: 'Yahoo',
            type: 'EMAIL',
            description: 'Connect your Yahoo inbox to centralize all legal correspondence.',
            status: 'idle',
            Icon: SiGmail
        }
    ];

    return (
        <div className={styles.group_container}>
            {integrations.map(integration => (
                <IntegrationCard
                    key={integration.id}
                    {...integration}
                />
            ))}
        </div>
    );
};

export default IntegrationGroup;