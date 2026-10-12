import React from 'react';
import styles from './Label.module.css';

const Label = ({ children, className, ...props }) => {
    return (
        <label

            className={`${styles.label_default} ${className || ''}`}
            {...props}
        >
            {children}
        </label>
    );
};

export default Label;
//Componente novo