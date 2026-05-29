import { useState } from 'react';
import styles from './NewTask.module.css';
import PageHeader from '../../components/ui/PageHearder.jsx';
import TaskForm from '../../components/ui/TaskForm.jsx';
import AIAssistant from '../../components/ui/AIAssistant.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import { useNavigate } from 'react-router-dom';

function NewTask() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        titulo: '',
        descricao: '',
        dataHorario: '',
        prioridade: 'media',
        responsavel: 'joao',
        sincronizar: false,
    });

    return (
        <div className={styles.container}>
            <BackButton label="Voltar para Dashboard" to="/dashboard" />
            <PageHeader title="Adicionar Nova Tarefa" subtitle="Crie uma tarefa manualmente ou escolha uma sugestão da IA" />
            <div className={styles.content}>
                <div className={styles.left}>
                    <TaskForm
                        formData={formData}
                        onFormDataChange={setFormData}
                        onCancel={() => navigate('/dashboard')}
                        onSubmit={(data) => console.log(data)}
                    />
                </div>
                <div className={styles.right}>
                    <AIAssistant onFillForm={(data) => setFormData(prev => ({ ...prev, ...data }))} />
                </div>
            </div>
        </div>
    );
}

export default NewTask;