import { useState, useEffect } from 'react';
import styles from './NewTask.module.css';
import PageHeader from '../../components/ui/PageHearder.jsx';
import TaskForm from '../../components/ui/TaskForm.jsx';
import AIAssistant from '../../components/ui/AIAssistant.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { toast } from 'react-toastify';

function NewTask() {
    const navigate = useNavigate();
    const [userId, setUserId] = useState(null);

    const [formData, setFormData] = useState({
        titulo: '',
        descricao: '',
        dataHorario: '',
        prioridade: 'media',
        responsavel: '',
        sincronizar: false,
    });

    useEffect(() => {
        api.get('auth/user/')
            .then(res => setUserId(res.data.id))
            .catch(err => console.error('Erro ao carregar usuário:', err));
    }, []);

    const handleSubmit = async (data) => {
        if (!data.titulo.trim()) {
            toast.error('O título da tarefa é obrigatório.');
            return;
        }
        if (!data.dataHorario) {
            toast.error('A data e horário são obrigatórios.');
            return;
        }
        try {
            await api.post('tasks/', {
                titulo: data.titulo,
                descricao: data.descricao || '',
                dataHorario: data.dataHorario,
                prioridade: data.prioridade,
                responsavel: userId,
                sincronizar: data.sincronizar,
            });
            toast.success('Tarefa criada com sucesso!');
            navigate('/dashboard');
        } catch (err) {
            toast.error('Erro ao criar tarefa. Tente novamente.');
        }
    };

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
                        onSubmit={handleSubmit}
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