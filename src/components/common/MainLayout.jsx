// src/components/layout/MainLayout.js
import React from 'react';
import { Outlet } from 'react-router-dom'; // Outlet renderiza o conteúdo da rota filha
import Navbar from './Navbar';
import BarraSup from './BarraSup';
import Footer from './Footer';

function MainLayout() {
    return (
        <>
            <Navbar />
            <BarraSup nome="Usuário" titulo="Cadrius AI" /> {/* Valores padrão ou vindos de contexto */}
            
            <div className="main_content_area">
                <Outlet /> {/* Aqui serão renderizadas as páginas: Dashboard, Automação, etc. */}
            </div>

            <Footer />
        </>
    );
}

export default MainLayout;