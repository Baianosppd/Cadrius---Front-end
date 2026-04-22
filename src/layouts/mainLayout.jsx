import { Outlet } from "react-router-dom";
import BarraSup from "../components/common/BarraSup";
import NavBar from "../components/common/Navbar";
import styles from "./MainLayout.module.css"; // Vamos criar este arquivo

import useAuth from '../hooks/useAuth';

export default function MainLayout() {

    const { user } = useAuth();

    const nome = user?.first_name || user?.email

    console.log("USER NO main layout:", user);
    return (
        <div className={styles.layout_container}>
            {/* Lado Esquerdo: Sidebar fixa */}
            <aside className={styles.sidebar_area}>
                <NavBar />
            </aside>

            {/* Lado Direito: Barra Superior + Conteúdo da Página */}
            <div className={styles.main_content}>
                <BarraSup
                    nome={nome}
                />


                <main className={styles.page_body}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}