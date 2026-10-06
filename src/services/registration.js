// Montagem e validação dos payloads de cadastro (contrato do back: accounts/registration.py)
import api, { API_ORIGIN } from './api';

export const onlyDigits = (v) => String(v || '').replace(/\D/g, '');

const AREAS = {
    'Direito Civil': 'civil', 'Direito Penal': 'penal', 'Direito Trabalhista': 'trabalhista',
    'Direito Tributário': 'tributario', 'Direito Empresarial': 'empresarial', 'Direito de Família': 'familia',
    'Direito Previdenciário': 'previdenciario', Outra: 'outra',
};
const TIPOS = { 'Sociedade Limitada (LTDA)': 'LTDA', 'Sociedade Anônima (S.A.)': 'SA', EIRELI: 'EIRELI', MEI: 'MEI' };
const PORTES = { mei: 'MEI', me: 'ME', epp: 'EPP', grande: 'GRANDE_PORTE' };
const REGIMES = { simples: 'SIMPLES_NACIONAL', presumido: 'LUCRO_PRESUMIDO', real: 'LUCRO_REAL' };

// Aceite dos documentos legais: { terms: '1.0', privacy: '1.0', ciencia: '1.0' } → campos do back
export function legalFields(legal = {}) {
    return {
        accepted_terms_version: legal.terms,
        accepted_privacy_version: legal.privacy,
        accepted_ciencia_version: legal.ciencia,
    };
}

export function individualPayload(f) {
    return {
        nome_completo: (f.nome || '').trim(),
        cpf: f.cpf || '',
        email: (f.email || '').trim(),
        senha: f.senha || '',
        plano_id: f.plano,
        cupom: (f.cupom || '').trim().toUpperCase(),
        oab_numero: f.oab || '',
        oab_uf: f.uf || '',
        area_atuacao: AREAS[f.area] || '',
        ...legalFields(f.legal),
    };
}

export function companyPayload(f) {
    return {
        razao_social: (f.razaoSocial || '').trim(),
        nome_fantasia: (f.nomeFantasia || '').trim(),
        cnpj: f.cnpj || '',
        tipo_sociedade: TIPOS[f.tipoSociedade] || '',
        porte_empresa: PORTES[f.porte] || '',
        regime_tributario: REGIMES[f.regime] || '',
        cep: f.cep || '',
        logradouro: f.logradouro || '',
        numero: f.numero || '',
        bairro: f.bairro || '',
        cidade: f.cidade || '',
        uf: f.uf || '',
        telefone_principal: f.telefone || '',
        email_corporativo: f.emailCorporativo || '',
        gerente: {
            nome_completo: (f.gerenteNome || '').trim(),
            cpf: f.gerenteCpf || '',
            email: (f.gerenteEmail || '').trim(),
            senha: f.gerenteSenha || '',
            cargo: f.gerenteCargo || '',
        },
        plano_id: f.plano,
        cupom: (f.cupom || '').trim().toUpperCase(),
        ...legalFields(f.legal),
    };
}

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '');

// Retorna a primeira mensagem de erro do passo (ou null). Validação final continua no back.
export function validateStep(kind, step, f) {
    if (kind === 'individual') {
        if (step === 1) {
            if ((f.nome || '').trim().split(/\s+/).filter(Boolean).length < 2) return 'Informe o nome completo.';
            if (onlyDigits(f.cpf).length !== 11) return 'Informe um CPF válido (11 dígitos).';
            if (!emailOk(f.email)) return 'Informe um e-mail válido.';
            if ((f.senha || '').length < 8) return 'A senha precisa ter ao menos 8 caracteres.';
            if (!f.legalOk) return 'É necessário aceitar os Termos, a Política de Privacidade e o Termo de Ciência.';
        }
        if (step === 3 && !f.plano) return 'Escolha um plano.';
    } else {
        if (step === 1) {
            if (!(f.razaoSocial || '').trim() || !(f.nomeFantasia || '').trim()) return 'Informe a razão social e o nome fantasia.';
            if (onlyDigits(f.cnpj).length !== 14) return 'Informe um CNPJ válido (14 dígitos).';
        }
        if (step === 2 && !f.porte) return 'Selecione o porte da empresa.';
        if (step === 4) {
            if ((f.gerenteNome || '').trim().split(/\s+/).filter(Boolean).length < 2) return 'Informe o nome completo do gerente.';
            if (onlyDigits(f.gerenteCpf).length !== 11) return 'Informe o CPF do gerente (11 dígitos).';
            if (!emailOk(f.gerenteEmail)) return 'Informe um e-mail válido para o gerente.';
            if ((f.gerenteSenha || '').length < 8) return 'A senha precisa ter ao menos 8 caracteres.';
            if (!f.legalOk) return 'É necessário aceitar os Termos, a Política de Privacidade e o Termo de Ciência.';
        }
        if (step === 6 && !f.plano) return 'Escolha um plano.';
    }
    return null;
}

// Traduz a resposta 400 do back em uma frase (campos aninhados incluídos)
export function registrationError(err) {
    if (!err.response) return 'Falha de comunicação com o servidor.';
    const data = err.response.data || {};
    const flat = (obj) => Object.values(obj).flatMap((v) => (Array.isArray(v) ? v : typeof v === 'object' && v ? flat(v) : [v]));
    const first = flat(data).find((m) => typeof m === 'string');
    return first || 'Não foi possível criar a conta. Verifique os dados.';
}

// Plano pago: abre o checkout do Stripe (a coleta do cartão acontece lá, nunca em nossos formulários)
export async function startCheckout(planId) {
    const { data } = await api.post(`${API_ORIGIN}/api/billing/checkout/`, { plan_id: planId });
    if (!data.checkout_url) throw new Error('checkout_url ausente');
    window.location.href = data.checkout_url;
}
