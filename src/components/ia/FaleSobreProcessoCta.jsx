import { FiMessageCircle } from 'react-icons/fi';
import { Button } from '../ui';
import s from './FaleSobreProcesso.module.css';

// Cartão de entrada (Painel e Automações)
export default function FaleSobreProcessoCta({ onOpen, compact }) {
    return (
        <div className={s.cta}>
            <div><strong>Fale sobre seu processo</strong>
                {!compact && <span>Conte como o escritório trabalha e a IA indica as automações que mais aliviam a sua rotina.</span>}</div>
            <Button variant="primary" icon={FiMessageCircle} onClick={onOpen}>Começar</Button>
        </div>
    );
}
