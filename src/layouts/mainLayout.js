import { Outlet } from "react-router-dom";


export default function MainLayout() {
    return (
        <div>

            <aside>
                <h2>Cadrius</h2>
                <nav>
                    <a href="/dashboard">Dashboard</a>
                    <a href="/automacao">Automação</a>
                    <a href="/processos">Processos</a>
                    <a href="/comunicacao">Comunicação</a>
                    <a href="/integracoes">Integrações</a>
                    <a href="/perfil">Perfil</a>
                </nav>
            </aside>

            <div>
                <header>
                    <span>Sistema de Automação Jurídica</span>
                </header>

                <main>
                    <Outlet />
                </main>
            </div>

        </div>
    );
}
