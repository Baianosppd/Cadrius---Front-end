// src/components/ui/SearchFilterBar.jsx
import React from 'react';
import styles from './SearchFilterBar.module.css';

import Input from './Input'

const SearchFilterBar = () => {
    return (
        <div className={styles.bar_container}>
            <Input
                type="text"
                placeholder="Search automations..."
                className={styles.search_input}
            />
            <button variant="outline" className={styles.filter_button}>
                Filter
            </button>
        </div>
    );
};

export default SearchFilterBar;