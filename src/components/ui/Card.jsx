import styles from './Card.module.css';

// Importe o componente Icone (você precisará ter um componente ou função para renderizar ícones como 'zap', 'file-text', etc.)
// Assumindo que você usa Feather Icons ou similar.

// ÚNICA DECLARAÇÃO DA FUNÇÃO CARD (Elimina o erro de "Identifier 'Card' has already been declared")
function Card(props) {

    // --- 1. Lógica para o Card de Dashboard (type="stat") ---
    if (props.type === 'stat') {
        // Desestruturação de props específicas para 'stat'
        const { titulo, num, obs, color, icon } = props;

        // Define as classes dinamicamente com base na prop 'color'
        const iconClass = styles[`icon_container_${color}`];
        const borderClass = styles[`border_${color}`];
        const obsColorClass = color === 'green' || color === 'blue' ? styles.obs_green : styles.obs_default;

        return (
            // Aplica a borda colorida vertical na esquerda
            <div className={`${styles.card_base} ${borderClass}`}>

                {/* Conteúdo principal do cartão */}
                <div className={styles.content_wrapper}>

                    {/* Título e Ícone */}
                    <div className={styles.header}>
                        <div>
                            <p className={styles.title}>{titulo}</p>
                            <h3 className={styles.number}>{num}</h3>
                        </div>
                        {/* O container do ícone recebe a cor de fundo e a cor do ícone */}
                        <div className={iconClass}>
                            {/* Ícone real */}
                            <i data-feather={icon} className={styles.icon_style}></i>
                        </div>
                    </div>

                    {/* Observação na parte inferior */}
                    <p className={`${styles.observation} ${obsColorClass}`}>
                        {obs}
                    </p>
                </div>
            </div>
        );
    }

    // --- 2. Lógica para o Card de Automação (type="automacao") ---
    else if (props.type === 'automacao') {
        // Desestruturação de props específicas para 'automacao'
        const { titulo, obs, status, infoSecundaria, color, icon } = props;

        const iconContainerClass = styles[`icon_container_${color}`];
        // As classes de status são baseadas no status (Ativa, Pausada, Erro)
        const statusClass = styles[`status_${status.toLowerCase()}`];

        return (
            <div className={`${styles.card_base_automacao}`}>
                <div className={styles.header_automacao}>

                    {/* Texto Principal */}
                    <div className={styles.text_content_automacao}>
                        <h3 className={styles.title_automacao}>{titulo}</h3>
                        <p className={styles.description_automacao}>{obs}</p>
                    </div>

                    {/* Ícone */}
                    <div className={`${styles.icon_wrapper_automacao} ${iconContainerClass}`}>
                        <i data-feather={icon} className={styles.icon_style_automacao}></i>
                    </div>
                </div>

                {/* Status e Info Secundária */}
                <div className={styles.footer_automacao}>
                    <span className={`${styles.status_badge} ${statusClass}`}>
                        {status}
                    </span>
                    <div className={styles.secondary_info}>
                        {infoSecundaria}
                    </div>
                </div>
            </div>
        );
    }

    // --- 3. Lógica para Container Genérico ---
    // Se o tipo não for especificado ou reconhecido, ele atua como um container simples
    // (fundo branco, sombra, padding) e renderiza o conteúdo passado via props.children.
    else {
        return (
            <div className={styles.card_base_generic}>
                {props.children}
            </div>
        );
    }
}

export default Card;