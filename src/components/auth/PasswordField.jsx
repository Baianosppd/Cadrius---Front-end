import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import Input from '../ui/Input';
import s from './AuthShell.module.css';

// Campo de senha com "mostrar/ocultar" (CAD-226): menos erro de digitação, sobretudo no celular
export default function PasswordField({ id, ...props }) {
    const [show, setShow] = useState(false);
    return (
        <div className={s.pwd_wrap}>
            <Input id={id} type={show ? 'text' : 'password'} {...props} className={s.pwd_input} />
            <button type="button" className={s.pwd_toggle} onClick={() => setShow((v) => !v)}
                aria-label={show ? 'Ocultar senha' : 'Mostrar senha'} aria-controls={id} aria-pressed={show}>
                {show ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
            </button>
        </div>
    );
}
