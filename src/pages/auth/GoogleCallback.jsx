import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

// Retorno do login social (Google/Microsoft). O back redireciona para /google/callback#access=...&refresh=...
// (fragmento: não vai para logs de servidor nem para o cabeçalho Referer). Também aceita ?access=&refresh=.
function GoogleCallback() {
    const navigate = useNavigate();
    const { loginWithTokens } = useAuth();
    const [error, setError] = useState(null);
    const done = useRef(false);

    useEffect(() => {
        if (done.current) return;
        done.current = true;

        const source = window.location.hash.length > 1 ? window.location.hash.slice(1) : window.location.search;
        const params = new URLSearchParams(source);
        const access = params.get("access");
        const refresh = params.get("refresh");

        // Remove os tokens da barra de endereço/histórico imediatamente
        window.history.replaceState(null, "", window.location.pathname);

        const login = !access || !refresh
            ? Promise.reject(new Error("sem tokens"))
            : loginWithTokens(access, refresh);

        login
            .then(() => navigate("/dashboard", { replace: true }))
            .catch(() => setError(
                !access || !refresh
                    ? "Não foi possível concluir o login social. Tente novamente ou entre com e-mail e senha."
                    : "Sessão inválida. Tente entrar novamente."
            ));
    }, [loginWithTokens, navigate]);

    if (error) {
        return (
            <div style={{ padding: 32, textAlign: "center" }}>
                <p>{error}</p>
                <button onClick={() => navigate("/", { replace: true })}>Voltar ao login</button>
            </div>
        );
    }
    return <div style={{ padding: 32, textAlign: "center" }}>Fazendo login...</div>;
}

export default GoogleCallback;
