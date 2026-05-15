// src/components/ui/Checkbox.jsx
import React from 'react';
import styles from './CheckBox.module.css';

const Checkbox = ({ label, id, className, ...props }) => {
    return (
        <div className={`${styles.checkbox_wrapper} ${className || ''}`}>
            <input
                type="checkbox"
                id={id}
                className={styles.hidden_checkbox}
                {...props}
            />
            <label htmlFor={id} className={styles.checkbox_label}>
                {label}
            </label>
        </div>
    );
};

export default Checkbox;
//Componente novo