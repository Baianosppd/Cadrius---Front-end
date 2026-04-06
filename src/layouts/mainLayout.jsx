import { Outlet } from "react-router-dom";
import BarraSup from "../components/common/BarraSup";
import NavBar from "../components/common/Navbar";
import styles from "./MainLayout.module.css"; // Vamos criar este arquivo

export default function MainLayout() {
    return (
        <div className={styles.layout_container}>
            {/* Lado Esquerdo: Sidebar fixa */}
            <aside className={styles.sidebar_area}>
                <NavBar />
            </aside>

            {/* Lado Direito: Barra Superior + Conteúdo da Página */}
            <div className={styles.main_content}>
                <BarraSup nome="John Doe" /> {/* Passe o nome aqui para testar */}

                <main className={styles.page_body}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}