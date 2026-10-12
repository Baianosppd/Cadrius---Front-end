import { Link } from 'react-router-dom';
import { Button } from '../ui';
import styles from './TasksToday.module.css';

const priorityLabels = {
    alta: 'Alta',
    media: 'Média',
    baixa: 'Baixa',
};

const fmtDay = (iso) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '');

const TaskItem = ({ description, time, date, overdue, priority, completed, onToggle }) => (
    <div className={styles.task_item}>
        <div className={styles.task_left}>
            <input
                type="checkbox"
                className={styles.checkbox}
                checked={completed}
                onChange={onToggle}
                aria-label={`Concluir: ${description}`}
            />
            <div className={styles.task_text}>
                <p className={styles.task_desc}>{description}</p>
                <span className={`${styles.task_time} ${overdue ? styles.overdue : ''}`}>
                    {overdue ? `Atrasada · ${fmtDay(date)} ${time}` : time}
                </span>
            </div>
        </div>
        <div className={styles.task_right}>
            <span className={`${styles.priority_badge} ${styles[priority]}`}>
                {priorityLabels[priority]}
            </span>
        </div>
    </div>
);

const TasksToday = ({ tasks = [], onToggleTask }) => {
    const completed = tasks.filter(t => t.completed).length;
    const late = tasks.filter(t => t.overdue).length;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.header_left}>
                    <h2 className={styles.title}>Tarefas de Hoje</h2>
                    <span className={styles.counter}>{completed} de {tasks.length} concluídas{late ? ` · ${late} atrasada${late > 1 ? 's' : ''}` : ''}</span>
                </div>
                <Button as={Link} to="/newtask" variant="primary" className={styles.add_button}>Nova tarefa</Button>
            </div>

            <div className={styles.task_list}>
                {tasks.length === 0 && <p className={styles.empty}>Nenhuma tarefa para hoje.</p>}
                {tasks.map(task => (
                    <TaskItem
                        key={task.id}
                        {...task}
                        onToggle={() => onToggleTask(task.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default TasksToday;