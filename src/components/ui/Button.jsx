import React from 'react';
import styles from './Button.module.css';

const Button = ({ children, className, ...props }) => {
    return (
        <button

            className={`${styles.btn_default} ${className || ''}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
//Componente novo