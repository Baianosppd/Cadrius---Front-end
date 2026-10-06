// Requisitos de senha mostrados enquanto a pessoa digita (CAD-221). O back valida de novo (validadores do Django).
export function passwordChecks(password, { previous = '', email = '' } = {}) {
    const p = String(password || '');
    const user = String(email || '').split('@')[0].toLowerCase();
    return [
        { label: 'Pelo menos 10 caracteres', ok: p.length >= 10 },
        { label: 'Letras e números', ok: /[a-zA-Z]/.test(p) && /\d/.test(p) },
        { label: 'Diferente da senha temporária', ok: !!p && p !== previous },
        { label: 'Não contém o seu e-mail', ok: !!p && (!user || user.length < 3 || !p.toLowerCase().includes(user)) },
    ];
}
