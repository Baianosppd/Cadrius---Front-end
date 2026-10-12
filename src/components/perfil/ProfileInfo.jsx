import { useState } from 'react';
import ui from '../ui/ui.module.css';
import { Button, Field, Input, Stack } from '../ui';

// Dados pessoais (CAD-230: a foto foi para a capa do perfil — ProfileCover). onSave pode ser assíncrono.
const ProfileInfo = ({ user = {}, onSave }) => {
    const [nome, setNome] = useState(user.nome || '');
    const [telefone, setTelefone] = useState(user.telefone || '');
    const [oab, setOab] = useState(user.oab || '');
    const [busy, setBusy] = useState(false);

    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        try { await onSave({ nome, telefone, oab }); } finally { setBusy(false); }
    };

    return (
        <Stack as="form" className={ui.card} onSubmit={save}>
            <h2 className={`${ui.section_title} ${ui.mb_0}`}>Informações pessoais</h2>
            <div className={ui.grid}>
                <Field label="Nome completo"><Input autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} /></Field>
                <Field label="E-mail" hint="O e-mail de acesso não pode ser alterado aqui."><Input value={user.email || ''} disabled /></Field>
                <Field label="Telefone"><Input type="tel" autoComplete="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} /></Field>
                <Field label="OAB (opcional)"><Input value={oab} onChange={(e) => setOab(e.target.value)} /></Field>
            </div>
            <Button type="submit" variant="primary" className={ui.w_fit} loading={busy} loadingLabel="Salvando…">Salvar alterações</Button>
        </Stack>
    );
};

export default ProfileInfo;
