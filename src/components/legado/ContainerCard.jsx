// src/components/ui/Card.jsx
import React from 'react';
import styles from './ContainerCard.module.css';

const ContainerCard = ({ children, className, ...props }) => {
    return (
        <div className={`${styles.ContainerCard_container} ${className || ''}`} {...props}>
            {children}
        </div>
    );
};

export default ContainerCard;
//Componente novo
