// Tela inicial depois do login (CAD-224): equipe Cadrius sem escritório vai para a Gestão,
// em vez de abrir o painel do escritório e receber 403 em tudo.
export const homePath = (me) => (me?.is_staff && !me?.organization ? '/gestao' : '/dashboard');
