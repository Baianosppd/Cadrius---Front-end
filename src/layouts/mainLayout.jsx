import { Outlet } from "react-router-dom";

import BarraSup from "../components/common/BarraSup";
import NavBar from "../components/common/Navbar";

export default function MainLayout() {
    return (
        <div>
            <BarraSup />
            <NavBar />

            <main
                style={{
                    marginLeft: "100px", // largura da navbar
                    marginTop: "70px",   // altura da barra superior
                    padding: "20px",
                }}
            >
                <Outlet />
            </main>
        </div>
    );
}