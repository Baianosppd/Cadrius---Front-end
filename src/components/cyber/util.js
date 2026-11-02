export const n = (v) => (v === null || v === undefined ? '—' : Number(v).toLocaleString('pt-BR'));
export const off = (block) => !block || block.indisponivel;
