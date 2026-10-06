import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { pendingMfa } from "../../services/mfa";
import { homePath } from "../../services/home";

// Retorno do login social (Google/Microsoft). O back redireciona para /google/callback#access=...&refresh=...
// (fragmento: não vai para logs de servidor nem para o cabeçalho Referer). Também aceita ?access=&refresh=.
const SSO_ERRORS = {
    no_account: "Não encontramos uma conta com esse e-mail. Crie sua conta primeiro e depois use o login social.",
    email_unverified: "O provedor não confirmou o seu e-mail, então não podemos vincular a conta. Entre com e-mail e senha.",
    account_disabled: "Esta conta está desativada. Fale com o administrador do seu escritório.",
    access_denied: "Você cancelou o login social.",
    sso_disabled: "O login social não está disponível neste ambiente.",
    state_invalid: "A sessão do login expirou. Tente novamente.",
};
const ssoErrorMessage = (code) => SSO_ERRORS[code]
    || "Não foi possível concluir o login social. Tente novamente ou entre com e-mail e senha.";

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
        const code = params.get("error"); // código devolvido pelo back (CAD-105)

        // Remove os tokens da barra de endereço/histórico imediatamente
        window.history.replaceState(null, "", window.location.pathname);

        // Conta com verificação em duas etapas: a tela de login pede o código (CAD-169)
        const mfaToken = params.get("mfa_token");
        if (mfaToken) {
            pendingMfa.save(mfaToken);
            navigate("/?mfa=1", { replace: true });
            return;
        }

        const login = !access || !refresh
            ? Promise.reject(new Error("sem tokens"))
            : loginWithTokens(access, refresh);

        login
            .then((me) => navigate(homePath(me), { replace: true }))
            .catch(() => setError(
                !access || !refresh
                    ? ssoErrorMessage(code)
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
