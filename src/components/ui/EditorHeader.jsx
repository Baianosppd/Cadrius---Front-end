import styles from './EditorHeader.module.css';
import { FiSave, FiUpload, FiLayout } from 'react-icons/fi';

const EditorHeader = ({
    title,
    active,
    lastExecution,
    nodeCount,
    onSave,
    onImport,
    onAutoLayout,
    onTitleChange,
    onToggleActive,
    saving,
}) => {
    return (
        <div className={styles.header}>
            <div className={styles.left}>
                <div className={styles.title_wrapper}>
                    {onTitleChange ? (
                        <input
                            className={styles.title}
                            style={{ border: '1px solid transparent', background: 'transparent', minWidth: 220 }}
                            value={title}
                            maxLength={255}
                            aria-label="Nome do fluxo"
                            onChange={(e) => onTitleChange(e.target.value)}
                        />
                    ) : (
                        <h1 className={styles.title}>{title || 'Novo Fluxo'}</h1>
                    )}
                    <span
                        className={`${styles.status} ${active ? styles.status_active : styles.status_inactive}`}
                        role={onToggleActive ? 'button' : undefined}
                        tabIndex={onToggleActive ? 0 : undefined}
                        style={onToggleActive ? { cursor: 'pointer' } : undefined}
                        onClick={onToggleActive}
                        onKeyDown={(e) => onToggleActive && (e.key === 'Enter' || e.key === ' ') && onToggleActive()}
                    >
                        <span className={styles.status_dot} />
                        {active ? 'Ativa' : 'Inativa'}
                    </span>
                </div>
                {lastExecution && (
                    <p className={styles.last_execution}>Última execução: {lastExecution}</p>
                )}
            </div>

            <div className={styles.center}>
                <div className={styles.counter}>
                    <span className={styles.counter_dot} style={{ backgroundColor: '#16a34a' }} />
                    <span>Gatilhos: {nodeCount.triggers}</span>
                </div>
                <div className={styles.counter}>
                    <span className={styles.counter_dot} style={{ backgroundColor: '#3b82f6' }} />
                    <span>Ações: {nodeCount.actions}</span>
                </div>
                <div className={styles.counter}>
                    <span className={styles.counter_dot} style={{ backgroundColor: '#f59e0b' }} />
                    <span>Condições: {nodeCount.conditions}</span>
                </div>
                <div className={styles.counter}>
                    <span className={styles.counter_dot} style={{ backgroundColor: '#8b5cf6' }} />
                    <span>Conexões: {nodeCount.connections}</span>
                </div>
            </div>

            <div className={styles.right}>
                <button className={styles.button_secondary} onClick={onAutoLayout}>
                    <FiLayout className={styles.button_icon} />
                    Organizar
                </button>
                <button className={styles.button_secondary} onClick={onImport}>
                    <FiUpload className={styles.button_icon} />
                    Importar
                </button>
                <button className={styles.button_primary} onClick={onSave} disabled={saving}>
                    <FiSave className={styles.button_icon} />
                    {saving ? 'Salvando…' : 'Salvar'}
                </button>
            </div>
        </div>
    );
};

export default EditorHeader;