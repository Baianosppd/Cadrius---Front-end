import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function GoogleCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        const access = params.get("access");
        const refresh = params.get("refresh");

        if (access && refresh) {
            localStorage.setItem("access_token", access);
            localStorage.setItem("refresh_token", refresh);
            navigate("/dashboard");
        }
        else {
            console.error("Login com Google falhou");
        }


    }, []);

    return <div>Fazendo login...</div>;
}

export default GoogleCallback;