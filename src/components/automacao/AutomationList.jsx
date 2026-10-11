import { Link } from 'react-router-dom';
import { FiSettings, FiTrash2 } from 'react-icons/fi';
import styles from './AutomationList.module.css';
import ui from '../ui/ui.module.css';
import { Button, Empty, Pill, Row, Table } from '../ui';
import { fmtDate } from '../../utils/format';

const AutomationRow = ({ workflow, canManage, onToggle, onApprove, onReject, onDelete }) => {
    const draft = workflow.awaiting_approval;
    const active = workflow.is_active;
    return (
        <tr>
            <td>
                <strong>{workflow.name}</strong>{' '}
                {workflow.ai_generated && <Pill tone="blue">IA{draft ? ' · aguardando aprovação' : ''}</Pill>}
                <div className={ui.muted}>Gatilho: {workflow.trigger?.event_type || '—'}</div>
            </td>
            <td data-label="Status">
                {/* Interruptor liga/desliga (rascunho da IA só liga depois de aprovado) */}
                <button
                    type="button"
                    className={`${styles.toggle} ${active ? styles.toggle_active : styles.toggle_inactive}`}
                    onClick={onToggle}
                    disabled={draft}
                    title={draft ? 'Aprove o rascunho para ativar' : active ? 'Desativar' : 'Ativar'}
                    aria-label={active ? 'Desativar automação' : 'Ativar automação'}
                    aria-pressed={active}
                >
                    <span className={`${styles.toggle_thumb} ${active ? styles.thumb_active : styles.thumb_inactive}`} />
                </button>
            </td>
            <td data-label="Ações do fluxo">{workflow.actions?.length ?? 0} ação(ões)</td>
            <td data-label="Criada em">{fmtDate(workflow.created_at)}</td>
            <td className={ui.td_actions}>
                <Row gap={1} wrap={false}>
                    {draft && canManage && <>
                        <Button size="sm" variant="primary" onClick={onApprove} title="Aprovar e ativar">Aprovar</Button>
                        <Button size="sm" onClick={onReject} title="Descartar rascunho">Rejeitar</Button>
                    </>}
                    {!draft && <>
                        <Button as={Link} to={`/editor?id=${workflow.id}`} size="sm" variant="ghost" icon={FiSettings} aria-label="Abrir no editor" title="Abrir no editor" />
                        <Button size="sm" variant="ghost" icon={FiTrash2} onClick={onDelete} aria-label="Excluir" title="Excluir" />
                    </>}
                </Row>
            </td>
        </tr>
    );
};

const AutomationList = ({ workflows = [], search = '', canManage = false, onToggle, onApprove, onReject, onDelete }) => {
    const filtered = workflows.filter((w) => w.name.toLowerCase().includes(search.toLowerCase()));
    return (
        <Table columns={['Nome do fluxo', 'Status', 'Ações do fluxo', 'Criada em', { label: 'Ações', className: ui.td_actions }]}
            empty={filtered.length === 0 && <Empty>Nenhuma automação ainda. Clique em “Criar nova automação” para criar a primeira.</Empty>}>
            {filtered.map((w) => (
                <AutomationRow key={w.id} workflow={w} canManage={canManage}
                    onToggle={() => onToggle(w)} onApprove={() => onApprove(w)} onReject={() => onReject(w)} onDelete={() => onDelete(w)} />
            ))}
        </Table>
    );
};

export default AutomationList;
