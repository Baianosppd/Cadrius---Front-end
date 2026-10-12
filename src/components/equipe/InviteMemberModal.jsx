import { useState } from 'react';
import { Field, FormModal, Input, Select } from '../ui';

// Convite de funcionário. O back recebe só e-mail e cargo; o nome a pessoa preenche ao aceitar o convite.
const InviteMemberModal = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({ email: '', role: 'MEMBER' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.email) return;
        setLoading(true);
        await onSave({ email: formData.email, role: formData.role });
        setLoading(false);
    };

    return (
        <FormModal title="Convidar funcionário" size="sm" onClose={onClose} onSubmit={handleSubmit} busy={loading}
            submitLabel="Convidar" busyLabel="Convidando…">
            <Field label="E-mail" hint="A pessoa recebe o convite neste e-mail e completa o próprio cadastro.">
                <Input type="email" required placeholder="joao@empresa.com" value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} />
            </Field>
            <Field label="Cargo">
                <Select value={formData.role} onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))}>
                    <option value="OWNER">Dono do Escritório</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="MEMBER">Advogado/Membro</option>
                    <option value="VIEWER">Apenas Leitura</option>
                </Select>
            </Field>
        </FormModal>
    );
};

export default InviteMemberModal;
