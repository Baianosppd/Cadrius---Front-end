import styles from './TasksToday.module.css';

const priorityLabels = {
    alta: 'Alta',
    media: 'Média',
    baixa: 'Baixa',
};

const TaskItem = ({ description, time, priority, completed, onToggle }) => (
    <div className={styles.task_item}>
        <div className={styles.task_left}>
            <input
                type="checkbox"
                className={styles.checkbox}
                checked={completed}
                onChange={onToggle}
            />
            <div className={styles.task_text}>
                <p className={styles.task_desc}>{description}</p>
                <span className={styles.task_time}>{time}</span>
            </div>
        </div>
        <div className={styles.task_right}>
            <span className={`${styles.priority_badge} ${styles[priority]}`}>
                {priorityLabels[priority]}
            </span>
            <a className={styles.details_link}>Ver detalhes &gt;</a>
        </div>
    </div>
);

const TasksToday = ({ tasks = [], onToggleTask, onAddTask }) => {
    const completed = tasks.filter(t => t.completed).length;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.header_left}>
                    <h2 className={styles.title}>Tarefas de Hoje</h2>
                    <span className={styles.counter}>{completed} de {tasks.length} concluídas</span>
                </div>
                <button className={styles.add_button} onClick={onAddTask}>
                    + Adicionar Nova Tarefa
                </button>
            </div>

            <div className={styles.task_list}>
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