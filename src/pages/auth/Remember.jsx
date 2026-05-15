import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import Title from '../../components/ui/Title';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Label from '../../components/ui/Label';
import ContainerCard from '../../components/ui/ContainerCard';
import FormGroup from '../../components/ui/FormGroup';

import styles from './Remember.module.css';

function Remember() {
    const [email, setEmail] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Enviar email para:", email);
    };

    return (
        <div className={styles.main_wrapper}>
            <div className={styles.side_image}>
                <img src="/imagem.png" alt="Cadrius" />
            </div>

            <div className={styles.side_form}>
                <ContainerCard>
                    <Title as="h1">Esqueceu a senha</Title>

                    <div className={styles.send}>
                        <form onSubmit={handleSubmit}>
                            <FormGroup>
                                <Label>Email</Label>
                                <Input
                                    placeholder="exemplo@gmail.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </FormGroup>

                            <Button type="submit">Enviar</Button>
                        </form>
                    </div>

                    <div className={styles.verify}>
                        <form onSubmit={handleSubmit}>
                            <Input
                                placeholder="-"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <Input
                                placeholder="-"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <Input
                                placeholder="-"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <Input
                                placeholder="-"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <Button type="submit">Verificar</Button>
                        </form>
                    </div>

                    <Link to="/">Voltar</Link>

                </ContainerCard>
            </div>
        </div>
    );
}

export default Remember;