import { FcGoogle } from "react-icons/fc"; // Flat Color version
// import { SiMicrosoft } from "react-icons/si"

function ButtonLogin({ tipo, msg }) {

    const icones = {
        google: <FcGoogle />,
        // microsoft: <SiMicrosoft />,
    };

    const icone = icones[tipo];

    function handleLogin() {
        if (tipo === "google") {
            window.location.href = "http://localhost:8000/api/v1/auth/google/";
        }
    }


    return (
        <div>
            <button onClick={handleLogin}>
                {msg}{icone}
            </button>
        </div>
    );
}

export default ButtonLogin;