import { FiMessageCircle } from 'react-icons/fi';
import ui from '../seguranca/seguranca.module.css';
import s from './FaleSobreProcesso.module.css';

// Cartão de entrada (Painel e Automações)
export default function FaleSobreProcessoCta({ onOpen, compact }) {
    return (
        <div className={s.cta}>
            <div><strong>Fale sobre seu processo</strong>
                {!compact && <span>Conte como o escritório trabalha e a IA indica as automações que mais aliviam a sua rotina.</span>}</div>
            <button type="button" className={`${ui.btn} ${ui.btn_primary}`} onClick={onOpen}><FiMessageCircle aria-hidden="true" /> Começar</button>
        </div>
    );
}
