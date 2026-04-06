// src/components/dashboard/TasksDay.jsx
import React from 'react';
import { FiCircle, FiCheckCircle } from 'react-icons/fi';
import styles from './TasksDay.module.css';

import Title from '../Title';

const TaskItem = ({ description, time, completed }) => (
    <div className={`${styles.task_item} ${completed ? styles.completed : ''}`}>
        <div className={styles.task_left}>
            {completed ? <FiCheckCircle className={styles.check_icon} /> : <FiCircle className={styles.circle_icon} />}
            <div className={styles.task_text}>
                <p className={styles.task_desc}>{description}</p>
                <span className={styles.task_time}>{time}</span>
            </div>
        </div>
        <a>Ver detalhes</a>
    </div>
);

const TasksDay = () => {
    const tasks = [
        { id: 1, description: 'Analisar as alterações contratuais relativas ao caso Chen.', time: '9:00 AM', completed: false },
        { id: 2, description: 'Obter informações sobre os termos do contrato de locação.', time: '7:00 AM', completed: false },
        { id: 3, description: 'Pesquisa sobre a aplicabilidade de cláusulas de não concorrência', time: '5:00 AM', completed: false },
        { id: 4, description: 'Prepare um relatório comparativo de mercado.', time: '12:00 AM', completed: true },
        { id: 5, description: 'Analisar as alterações contratuais relativas ao caso New York 09.', time: '8:00 AM', completed: true },
    ];

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;

    const progressPercentage = (completedTasks / totalTasks) * 100;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Title as="h2" className={styles.title}>Tarefas de hoje</Title>
                <span className={styles.counter}>{completedTasks}/{totalTasks}</span>
            </div>

            <div className={styles.progress_bar}>
                <div
                    className={styles.progress_fill}
                    style={{ width: `${progressPercentage}%` }}
                ></div>
            </div>

            <div className={styles.task_list}>
                {tasks.map(task => (
                    <TaskItem key={task.id} {...task} />
                ))}
            </div>
        </div>
    );
};

export default TasksDay;