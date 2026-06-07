import { FcGoogle } from "react-icons/fc";
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

function BotaoInterno({ tipo, msg }) {
    const icones = { google: <FcGoogle /> };
    const icone = icones[tipo];

    const loginComGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const res = await axios.post(${ import.meta.env.VITE_API_URL }auth / google / login /, {
                    access_token: tokenResponse.access_token,
                });
                console.log("Sucesso! Resposta do Django:", res.data);
                // Aqui deve gerir o token (ex: localStorage.setItem('token', res.data.key))
            } catch (error) {
                console.error("Erro ao validar token no Django:", error);
            }
        },
        onError: (error) => console.log('Pop-up falhou:', error),
    });

    return (
        <div>
            <button onClick={() => tipo === "google" ? loginComGoogle() : console.log("Outro")}>
                {msg}{icone}
            </button>
        </div>
    );
}

export default function ButtonLogin({ tipo, msg }) {
    if (tipo === "google") {
        return (
            <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                <BotaoInterno tipo={tipo} msg={msg} />
            </GoogleOAuthProvider>
        );
    }
    return <BotaoInterno tipo={tipo} msg={msg} />;
}

export default ButtonLogin;