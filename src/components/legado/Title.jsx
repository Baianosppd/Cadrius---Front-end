import React from 'react';

import styles from './Title.module.css';

const Title = ({ children, className, as: Tag = 'h1', ...props }) => { //as: Tag = 'h1' caso nao passe nada será h1
    return (
        <Tag
            className={`${styles.default_title} ${className || ''}`}
            {...props}
        >
            {children}
        </Tag>
    );
};

export default Title;
//Componente novo