function BotaoIcone({ onClick, title, className, icon, iconClassName, type = "button" }) {

    return (
        <button
            type={type}
            title={title}
            onClick={onClick}
            className={className}
        >
            <i data-feather={icon} className={iconClassName}></i>
        </button>
    );
}

export default BotaoIcone;
