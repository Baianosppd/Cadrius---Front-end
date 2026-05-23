// src/components/ui/FormGroup.jsx
import React from 'react';
import styles from './FormGroup.module.css';

const FormGroup = ({ children, className, ...props }) => {
    return (
        <div className={`${styles.FormGroup_container} ${className || ''}`} {...props}>
            {children}
        </div>
    );
};

export default FormGroup;
//Componente novo