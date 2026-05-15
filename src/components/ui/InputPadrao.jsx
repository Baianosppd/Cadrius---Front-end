// src/components/layout/InputPadrao.js

import React, { useState } from 'react';
import styles from './InputPadrao.module.css';
// Importa todos os ícones necessários do react-icons/fi
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

function InputPadrao({ labelConteudo, placeholder, tipo, nome, value, onChange }) {

    // O tipo de input real (pode ser "password" ou "text")
    const [inputType, setInputType] = useState(tipo);
    // Estado para saber se a senha está visível (para alternar o ícone)
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // Lógica para determinar qual ícone principal (Mail/Lock) usar
    let IconComponent = null;
    if (tipo === 'email') {
        IconComponent = FiMail;
    } else if (tipo === 'password') {
        IconComponent = FiLock;
    }

    // Função que alterna a visibilidade da senha
    const togglePasswordVisibility = () => {
        if (isPasswordVisible) {
            setInputType('password');
        } else {
            setInputType('text');
        }
        setIsPasswordVisible(!isPasswordVisible);
    };

    // ----------------------------------------------------
    // --- Renderização do Checkbox (Lembrar de mim) ---
    // ----------------------------------------------------
    if (tipo === 'checkbox') {
        return (
            <label className={styles.checkbox_group}>
                <input
                    name={nome}
                    type={tipo}
                    className={styles.checkbox_input}
                    // Usa 'checked' em vez de 'value' para checkbox
                    checked={value}
                    onChange={onChange}
                />
                {labelConteudo}
            </label>
        );
    }
    // ----------------------------------------------------

    // --- Renderização Padrão (E-mail/Senha) ---
    return (
        <div className={styles.input_container}>
            <label className={styles.input_label}>{labelConteudo}</label>

            <div className={styles.input_wrapper}>

                {/* Ícone principal (Mail/Lock) */}
                {IconComponent && <IconComponent className={styles.input_icon} />}

                <input
                    name={nome}
                    // 🚨 Usa o tipo controlado pelo estado (inputType)
                    type={tipo === 'password' ? inputType : tipo}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    // Aplica padding-left se houver ícone
                    className={`${styles.input_field} ${IconComponent ? styles.input_field_with_icon : ''}`}
                />

                {/* Ícone Olho (APENAS no campo de SENHA) */}
                {tipo === 'password' && (
                    <div
                        className={styles.password_toggle_icon_wrapper}
                        onClick={togglePasswordVisibility}
                    >
                        {isPasswordVisible ? (
                            <FiEyeOff className={styles.password_toggle_icon} />
                        ) : (
                            <FiEye className={styles.password_toggle_icon} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// 🚨 CORREÇÃO PRINCIPAL: Garante que o componente seja exportado como DEFAULT
export default InputPadrao;