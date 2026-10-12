export function fmtDateTime(value) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR');
}
export function fmtDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
}

// Mensagem de erro amigável a partir da resposta do back
export function errorMessage(err, fallback = 'Não foi possível concluir. Tente novamente.') {
    const data = err?.response?.data;
    if (!err?.response) return 'Falha de comunicação com o servidor.';
    if (typeof data?.detail === 'string') return data.detail;
    if (data && typeof data === 'object') {
        const first = Object.values(data)[0];
        if (Array.isArray(first) && typeof first[0] === 'string') return first[0];
        if (typeof first === 'string') return first;
    }
    return fallback;
}

const money = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Máscara de caixa: usa só os dígitos e trata os 2 últimos como centavos → "1.234,56".
// Número (valor vindo da API, ex.: 1500.5) é formatado direto.
export function maskMoney(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? money.format(value) : '';
    const digits = String(value ?? '').replace(/\D/g, '').replace(/^0+/, '').slice(0, 13);
    return digits ? money.format(Number(digits) / 100) : '';
}

// Máscara por molde: '#' = dígito; o resto entra conforme a pessoa digita. Letras são ignoradas.
function maskPattern(value, pattern) {
    const digits = String(value ?? '').replace(/\D/g, '');
    let out = '';
    let i = 0;
    for (const ch of pattern) {
        if (i >= digits.length) break;
        out += ch === '#' ? digits[i++] : ch;
    }
    return out;
}

export const maskCpf = (v) => maskPattern(v, '###.###.###-##');
export const maskCnpj = (v) => maskPattern(v, '##.###.###/####-##');
export const maskCep = (v) => maskPattern(v, '#####-###');
// Fixo (10 dígitos) → (11) 3456-7890; celular (11 dígitos) → (11) 98765-4321
export const maskPhone = (v) => {
    const n = String(v ?? '').replace(/\D/g, '').length;
    return maskPattern(v, n > 10 ? '(##) #####-####' : '(##) ####-####');
};
