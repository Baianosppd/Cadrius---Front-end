import { FiInfo } from 'react-icons/fi';
import ui from '../seguranca/seguranca.module.css';

// CAD-227: explicação que não precisa ocupar a tela toda vez — uma linha que abre quando a pessoa quer ler
export default function InfoHint({ summary, children }) {
    return (
        <details className={ui.hint}>
            <summary><FiInfo aria-hidden="true" /> {summary}</summary>
            <div className={ui.hint_body}>{children}</div>
        </details>
    );
}
