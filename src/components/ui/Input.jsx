import React from 'react';
import styles from './Input.module.css';

const Input = ({ children, className, ...props }) => {
    return (
        <input

            className={`${styles.input_default} ${className || ''}`}
            {...props}
        >
            {children}
        </input>
    );
};

export default Input;
//Componente novo