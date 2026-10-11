import { useState } from 'react';
import { FiEye } from 'react-icons/fi';
import { Button, Field, FilterBar, Select } from '../ui';
import EmailPreview from './EmailPreview';
import { VISUAL_OPTIONS } from '../../services/emailVisual';

// Visual do e-mail na regra (CAD-226): escolha + prévia
export default function EmailVisualField({ value, onChange, assunto, mensagem }) {
    const [open, setOpen] = useState(false);
    return (
        <FilterBar>
            <Field label="Visual do e-mail">
                <Select value={value || ''} onChange={(e) => onChange(e.target.value)}>
                    {VISUAL_OPTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </Select>
            </Field>
            <Button icon={FiEye} onClick={() => setOpen(true)}>Ver prévia</Button>
            {open && <EmailPreview assunto={assunto} mensagem={mensagem} visual={value || ''} onClose={() => setOpen(false)} />}
        </FilterBar>
    );
}
