import styles from './BotaoLogin.module.css';
import { FiArrowRight, FiUserPlus, FiLogIn } from 'react-icons/fi'; // Ícones necessários

// O componente agora recebe a classe específica via props
function BotaoLogin({ texto, nome, tipo, valor, onClick, className }) {

    const isPrimary = tipo === 'submit';
    const isSecondary = tipo === 'button' && (texto.includes('Criar nova conta') || texto.includes('Fazer Login'));

    let IconComponent = null;

    if (isPrimary && texto.includes('Acessar Portal')) {
        IconComponent = FiArrowRight; // Seta para Acessar Portal
    } else if (isPrimary && texto.includes('Registrar Conta')) {
        IconComponent = FiUserPlus; // Pessoa+ para Registrar Conta
    } else if (isSecondary && (texto.includes('Criar nova conta') || texto.includes('Registrar'))) {
        IconComponent = FiUserPlus; // Pessoa+ para Criar/Registrar
    } else if (isSecondary && texto.includes('Fazer Login')) {
        IconComponent = FiLogIn; // Login
    }

    return (
        <button
            name={nome}
            type={tipo}
            value={valor}
            onClick={onClick}
            // 🚨 Aplica a classe NEON/GLOW específica (passada via className)
            // e classes de base para estilo e layout
            className={`${className} ${isPrimary ? styles.button_primary : ''} ${isSecondary ? styles.button_secondary : ''}`}
        >
            {/* Renderiza o ícone à esquerda do texto */}
            {IconComponent && <IconComponent className={styles.button_icon} />}

            {texto}
        </button>
    );
}
/*
function BotaoLogin({ texto, nome, tipo, valor, onClick }) {
    return (
        <button
            name={nome}
            type={tipo}
            value={valor}
            onClick={onClick}
        >
            {texto}
        </button>
    );
}
*/
export default BotaoLogin;
