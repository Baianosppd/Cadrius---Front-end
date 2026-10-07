import { useState } from 'react';
import { FiEye } from 'react-icons/fi';
import ui from '../seguranca/seguranca.module.css';
import EmailPreview from './EmailPreview';
import { VISUAL_OPTIONS } from '../../services/emailVisual';


// Visual do e-mail na regra (CAD-226): escolha + prévia
export default function EmailVisualField({ value, onChange, assunto, mensagem }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={ui.filters} style={{ alignItems: 'flex-end' }}>
            <label className={ui.field}>Visual do e-mail
                <select className={ui.select} value={value || ''} onChange={(e) => onChange(e.target.value)}>
                    {VISUAL_OPTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
            </label>
            <button type="button" className={ui.btn} onClick={() => setOpen(true)}><FiEye aria-hidden="true" /> Ver prévia</button>
            {open && <EmailPreview assunto={assunto} mensagem={mensagem} visual={value || ''} onClose={() => setOpen(false)} />}
        </div>
    );
}
