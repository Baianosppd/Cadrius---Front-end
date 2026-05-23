
import React from 'react';
import { FiPlus, FiCpu, FiZap } from 'react-icons/fi'; // Sugestão de ícones
import styles from './AutomationSection.module.css';

const TemplateCard = ({ title, description }) => (
    <div className={styles.template_card}>
        <h4 className={styles.template_title}>{title}</h4>
        <p className={styles.template_description}>{description}</p>
    </div>
);

const AutomationSection = () => {
    const templates = [
        {
            id: 1,
            title: 'Court Summons Alert',
            description: 'Auto-detect court alerts and add them to calendars.'
        },
        {
            id: 2,
            title: 'Court Summons Alert',
            description: 'Auto-detect court alerts and add them to calendars.'
        },
        {
            id: 3,
            title: 'Court Summons Alert',
            description: 'Auto-detect court alerts and add them to calendars.'
        },
        {
            id: 4,
            title: 'Court Summons Alert',
            description: 'Auto-detect court alerts and add them to calendars.'
        }
    ];

    return (
        <section className={styles.hero_container}>
            {/* Seção Principal de Chamada */}
            <div className={styles.hero_content}>
                <div className={styles.main_icon_wrapper}>
                    <FiPlus className={styles.main_icon} />
                </div>

                <h1 className={styles.hero_title}>Create your first automation</h1>
                <p className={styles.hero_subtitle}>
                    Create custom workflows to automate repetitive tasks.
                    No coding required, just select the triggers and actions.
                </p>

                <div className={styles.hero_buttons}>
                    <button className={styles.btn_create}>
                        <FiZap /> Create New Automation
                    </button>
                    <button variant="outline" className={styles.btn_ai_suggestions}>
                        <FiCpu /> AI Suggestions
                    </button>
                </div>
            </div>

            <hr className={styles.divider} />

            {/* Seção de Templates Populares */}
            <div className={styles.templates_section}>
                <h3 className={styles.section_label}>Popular Templates</h3>
                <div className={styles.templates_grid}>
                    {templates.map(template => (
                        <TemplateCard
                            key={template.id}
                            title={template.title}
                            description={template.description}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AutomationSection;