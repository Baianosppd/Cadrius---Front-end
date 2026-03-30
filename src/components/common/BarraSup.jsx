// src/components/layout/BarraSup.js
import React, { useEffect } from 'react';
import styles from './BarraSup.module.css';

function BarraSup({ nome, titulo }) {

    // Garante que os ícones Feather sejam carregados
    useEffect(() => {
        if (window.feather) window.feather.replace();
    });

    return (
        <header className={styles.barra_superior}>

            {/* Título da Página */}
            <h1 className={styles.page_title}>{titulo || 'Cadrius AI'}</h1>

            {/* Área de Controles */}
            <div className={styles.controls_area}>

                {/* Botão de Notificações */}
                <button className={styles.icon_button}>
                    <i data-feather="bell" className={styles.icon}></i>
                </button>

                {/* Campo de Pesquisa */}
                <div className={styles.search_container}>
                    <input type="text" placeholder="Pesquisar..." className={styles.search_input} />
                    <i data-feather="search" className={styles.search_icon}></i>
                </div>

                {/* Perfil do Usuário */}
                <div className={styles.user_profile}>
                    <div className={styles.user_avatar}>
                        {/* Pega a primeira letra do nome ou mostra 'U' se estiver vazio */}
                        {nome ? nome.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className={styles.user_name}>{nome || 'Usuário'}</span>
                </div>
            </div>
        </header>
    );
}

export default BarraSup;