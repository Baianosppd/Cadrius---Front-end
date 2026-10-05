import styles from './AutomationList.module.css';
import { FiSettings, FiTrash2 } from 'react-icons/fi';

const AutomationRow = ({ workflow, canManage, onToggle, onEdit, onApprove, onReject, onDelete }) => {
    const draft = workflow.awaiting_approval;
    const active = workflow.is_active;
    return (
        <tr className={styles.row}>
            <td className={styles.cell_name}>
                <p className={styles.name}>
                    {workflow.name}{' '}
                    {workflow.ai_generated && (
                        <span title="Criada pela IA" style={{ fontSize: 11, background: '#ede9fe', color: '#5b21b6', borderRadius: 999, padding: '1px 8px', marginLeft: 6 }}>
                            IA{draft ? ' · aguardando aprovação' : ''}
                        </span>
                    )}
                </p>
                <span className={styles.trigger}>Gatilho: {workflow.trigger?.event_type || '—'}</span>
            </td>
            <td className={styles.cell}>
                <button
                    className={`${styles.toggle} ${active ? styles.toggle_active : styles.toggle_inactive}`}
                    onClick={onToggle}
                    disabled={draft}
                    title={draft ? 'Aprove o rascunho para ativar' : active ? 'Desativar' : 'Ativar'}
                    aria-pressed={active}
                >
                    <span className={`${styles.toggle_thumb} ${active ? styles.thumb_active : styles.thumb_inactive}`} />
                </button>
            </td>
            <td className={styles.cell}>{workflow.actions?.length ?? 0} ação(ões)</td>
            <td className={styles.cell}>{new Date(workflow.created_at).toLocaleDateString('pt-BR')}</td>
            <td className={styles.cell_actions}>
                {draft && canManage && (
                    <>
                        <button className={styles.action_button} onClick={onApprove} title="Aprovar e ativar">Aprovar</button>
                        <button className={styles.action_button} onClick={onReject} title="Descartar rascunho">Rejeitar</button>
                    </>
                )}
                {!draft && (
                    <>
                        <button className={styles.action_button} onClick={onEdit} title="Abrir no editor"><FiSettings className={styles.action_icon} /></button>
                        <button className={styles.action_button} onClick={onDelete} title="Excluir"><FiTrash2 className={styles.action_icon} /></button>
                    </>
                )}
            </td>
        </tr>
    );
};

const AutomationList = ({ workflows = [], search = '', canManage = false, onToggle, onEdit, onApprove, onReject, onDelete }) => {
    const filtered = workflows.filter((w) => w.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className={styles.container}>
            <table className={styles.table}>
                <thead>
                    <tr className={styles.header_row}>
                        <th className={styles.header_cell}>Nome do Fluxo</th>
                        <th className={styles.header_cell}>Status</th>
                        <th className={styles.header_cell}>Ações do fluxo</th>
                        <th className={styles.header_cell}>Criada em</th>
                        <th className={styles.header_cell}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map((w) => (
                        <AutomationRow
                            key={w.id}
                            workflow={w}
                            canManage={canManage}
                            onToggle={() => onToggle(w)}
                            onEdit={() => onEdit(w)}
                            onApprove={() => onApprove(w)}
                            onReject={() => onReject(w)}
                            onDelete={() => onDelete(w)}
                        />
                    ))}
                    {filtered.length === 0 && (
                        <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--c-muted)' }}>Nenhuma automação ainda. Clique em “Criar Nova Automação” para criar a primeira.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default AutomationList;
