// src/components/pages/Automacao.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import styles from './Automacao.module.css';
import Card from '../../components/ui/Card';


import NewAutomationModal from '../../components/common/NewAutomationModal';
import SimulationModal from '../../components/common/SimulationModal';
import TextoCarregando from '../../components/ui/TextoCarregando';
import BotaoIcone from '../../components/ui/BotaoIcone';

function Automacao() {
    // 1. Estado para armazenar as regras vindas da API
    const [automacoes, setAutomacoes] = useState([]);
    const [loading, setLoading] = useState(true);

    // 2. Estados para controlar a visibilidade dos Modais
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);

    // 3. Função para buscar dados atualizados
    const loadAutomacoes = async () => {
        setLoading(true);
        try {
            const response = await api.get('automation-rules/');
            // O Django Pagination retorna { results: [...] } ou lista direta
            const data = response.data.results ? response.data.results : response.data;
            setAutomacoes(data);
        } catch (error) {
            console.error("Erro ao carregar automações", error);
        } finally {
            setLoading(false);
        }
    };

    // Carrega ao montar a tela
    useEffect(() => {
        loadAutomacoes();
    }, []);

    // Garante que os ícones Feather sejam renderizados quando o estado mudar
    useEffect(() => {
        if (window.feather) window.feather.replace();
    });

    return (
        <div className={styles.automacao_container}>

            {/* Grid de Automações */}
            <div className={styles.automacao_grid}>

                {loading ? (
                    <TextoCarregando text={'Carregando Automações...'}></TextoCarregando>
                ) : (
                    automacoes.map(auto => (
                        <Card
                            key={auto.id}
                            type="automacao"
                            titulo={auto.name}
                            obs={`Prioridade: ${auto.priority}`}
                            // Status baseado no booleano is_active
                            status={auto.is_active ? "Ativa" : "Pausada"}
                            // Exibe qual caixa de e-mail essa regra monitora
                            infoSecundaria={`Caixa: ${auto.mailbox_name || 'N/A'}`}
                            color={auto.is_active ? "blue" : "yellow"}
                            icon="zap"
                        />
                    ))
                )}

                {/* Estado Vazio */}
                {!loading && automacoes.length === 0 && (
                    <div className={styles.empty_state}>
                        <p>Nenhuma automação criada ainda.</p>
                        <p>Crie uma regra para começar a processar seus e-mails com IA.</p>
                    </div>
                )}

            </div>

            {/* --- BOTÕES DE AÇÃO FLUTUANTES --- */}
            <div className={styles.floating_actions}>


                {/* 1. Botão de Simulação (Roxo - Play) */}
                {/* Permite testar o envio para o Telegram sem um e-mail real */}
                {automacoes.length > 0 && (

                    <BotaoIcone
                        className={`${styles.add_button} ${styles.simulate_button}`}
                        icon="play"
                        iconClassName={styles.add_icon}
                        title="Testar Fluxo (Simular E-mail)"
                        onClick={() => setIsSimulateModalOpen(true)}>
                    </BotaoIcone>
                )}

                {/* 2. Botão de Criar Nova Regra (Azul - Plus) */}

                <BotaoIcone
                    className={styles.add_button}
                    icon="plus"
                    iconClassName={styles.add_icon}
                    title="Nova Automação"
                    onClick={() => setIsCreateModalOpen(true)}>
                </BotaoIcone>

            </div>

            {/* --- MODAIS --- */}

            {/* Modal para criar nova regra no banco de dados */}
            <NewAutomationModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    loadAutomacoes(); // Recarrega a lista após fechar (caso tenha salvo algo)
                }}
            />

            {/* Modal para injetar e-mail falso e testar a integração com Telegram */}
            <SimulationModal
                isOpen={isSimulateModalOpen}
                onClose={() => setIsSimulateModalOpen(false)}
            />

        </div>
    );
}

export default Automacao;