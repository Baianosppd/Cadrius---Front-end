// Ilustrações próprias do meio jurídico (CAD-219): vetores leves, sem licença de terceiros, que seguem as cores da marca
// e o modo noturno (usam os tokens de cor). Todas são decorativas (aria-hidden), com o texto sempre ao lado.
const C = {
    ink: 'var(--c-ink)', primary: 'var(--c-primary)', p600: 'var(--c-primary-600)', p100: 'var(--c-primary-100)', p50: 'var(--c-primary-50)',
    s3: 'var(--c-surface-3)', s2: 'var(--c-surface-2)', surf: 'var(--c-surface)', border: 'var(--c-border-2)', muted: 'var(--c-muted)',
    gold: '#d4a24c', goldSoft: 'rgba(212, 162, 76, .22)', wood: '#8b5e3c', woodDark: '#6b4428', green: '#4f8a6b',
};

// Fachada de tribunal com colunas, frontão e a balança da justiça
export function CourthouseScene({ className, style }) {
    return (
        <svg viewBox="0 0 480 300" className={className} style={style} aria-hidden="true" focusable="false">
            <ellipse cx="240" cy="282" rx="210" ry="12" fill={C.s3} />
            <circle cx="390" cy="70" r="40" fill={C.goldSoft} />
            {/* frontão */}
            <polygon points="90,104 240,40 390,104" fill={C.p100} stroke={C.primary} strokeWidth="3" strokeLinejoin="round" />
            <rect x="82" y="104" width="316" height="16" rx="3" fill={C.primary} />
            {/* balança no frontão */}
            <g stroke={C.p600} strokeWidth="2.5" fill="none" strokeLinecap="round">
                <line x1="240" y1="58" x2="240" y2="96" />
                <line x1="214" y1="66" x2="266" y2="66" />
                <path d="M214 66 L206 82 M214 66 L222 82" />
                <path d="M266 66 L258 82 M266 66 L274 82" />
            </g>
            <path d="M203 82 Q214 92 225 82 Z" fill={C.gold} />
            <path d="M255 82 Q266 92 277 82 Z" fill={C.gold} />
            {/* colunas */}
            {[110, 160, 210, 260, 310, 360].map((x) => (
                <g key={x}>
                    <rect x={x - 4} y="122" width="28" height="8" rx="2" fill={C.border} />
                    <rect x={x} y="130" width="20" height="104" fill={C.surf} stroke={C.border} strokeWidth="1.5" />
                    <line x1={x + 7} y1="134" x2={x + 7} y2="230" stroke={C.s3} strokeWidth="2" />
                    <line x1={x + 13} y1="134" x2={x + 13} y2="230" stroke={C.s3} strokeWidth="2" />
                    <rect x={x - 4} y="234" width="28" height="8" rx="2" fill={C.border} />
                </g>
            ))}
            {/* degraus */}
            <rect x="74" y="242" width="332" height="12" rx="3" fill={C.p100} />
            <rect x="60" y="254" width="360" height="12" rx="3" fill={C.p50} stroke={C.p100} />
            {/* livros e martelo */}
            <g transform="translate(26 214)">
                <rect x="0" y="34" width="56" height="12" rx="2" fill={C.primary} />
                <rect x="4" y="22" width="50" height="12" rx="2" fill={C.gold} />
                <rect x="0" y="10" width="54" height="12" rx="2" fill={C.p600} />
                <line x1="8" y1="16" x2="46" y2="16" stroke={C.p100} strokeWidth="1.5" />
            </g>
            <g transform="translate(408 236) rotate(-28)">
                <rect x="-6" y="-8" width="34" height="16" rx="4" fill={C.wood} />
                <rect x="26" y="-3" width="40" height="6" rx="3" fill={C.woodDark} />
            </g>
            <rect x="398" y="258" width="44" height="8" rx="3" fill={C.woodDark} />
        </svg>
    );
}

// Mesa do advogado: notebook com peça, carteira da OAB, livros, café
export function LawyerDesk({ className, style }) {
    return (
        <svg viewBox="0 0 240 160" className={className} style={style} aria-hidden="true" focusable="false">
            <ellipse cx="120" cy="150" rx="104" ry="7" fill={C.s3} />
            <rect x="20" y="118" width="200" height="10" rx="3" fill={C.wood} />
            <rect x="34" y="128" width="8" height="20" fill={C.woodDark} />
            <rect x="198" y="128" width="8" height="20" fill={C.woodDark} />
            {/* notebook */}
            <rect x="72" y="52" width="96" height="62" rx="6" fill={C.ink} />
            <rect x="77" y="57" width="86" height="52" rx="3" fill={C.surf} />
            <rect x="85" y="64" width="40" height="5" rx="2" fill={C.primary} />
            {[74, 81, 88, 95].map((y) => <rect key={y} x="85" y={y} width={y === 95 ? 44 : 70} height="3" rx="1.5" fill={C.s3} />)}
            <circle cx="150" cy="99" r="6" fill="none" stroke={C.gold} strokeWidth="2" />
            <path d="M147 99 l2 2 l4 -4" stroke={C.gold} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M62 114 H178 L170 118 H70 Z" fill={C.border} />
            {/* carteira OAB */}
            <g transform="translate(176 92) rotate(-8)">
                <rect width="36" height="24" rx="3" fill={C.p600} />
                <rect x="4" y="5" width="10" height="13" rx="2" fill={C.p100} />
                <rect x="17" y="6" width="14" height="3" rx="1.5" fill={C.p100} />
                <rect x="17" y="12" width="10" height="3" rx="1.5" fill={C.gold} />
            </g>
            {/* livros */}
            <rect x="26" y="96" width="40" height="8" rx="2" fill={C.primary} />
            <rect x="30" y="88" width="34" height="8" rx="2" fill={C.gold} />
            <rect x="26" y="104" width="42" height="14" rx="2" fill={C.p600} />
            {/* café */}
            <rect x="198" y="100" width="14" height="18" rx="3" fill={C.surf} stroke={C.border} />
            <path d="M212 104 q6 0 6 5 q0 5 -6 5" stroke={C.border} strokeWidth="2" fill="none" />
            <path d="M202 94 q3 -4 0 -8 M208 94 q3 -4 0 -8" stroke={C.muted} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
    );
}

// Escritório: sala de reunião com a equipe e a balança na parede
export function LawFirmTeam({ className, style }) {
    const person = (x, color) => (
        <g transform={`translate(${x} 0)`}>
            <circle cx="0" cy="70" r="11" fill={C.goldSoft} stroke={C.gold} strokeWidth="1.5" />
            <path d="M-18 112 q0 -26 18 -26 q18 0 18 26 Z" fill={color} />
        </g>
    );
    return (
        <svg viewBox="0 0 240 160" className={className} style={style} aria-hidden="true" focusable="false">
            <ellipse cx="120" cy="150" rx="104" ry="7" fill={C.s3} />
            <rect x="22" y="14" width="196" height="96" rx="8" fill={C.p50} stroke={C.p100} />
            {/* quadro com balança */}
            <rect x="96" y="22" width="48" height="34" rx="4" fill={C.surf} stroke={C.border} />
            <g stroke={C.p600} strokeWidth="2" fill="none" strokeLinecap="round">
                <line x1="120" y1="28" x2="120" y2="50" /><line x1="106" y1="32" x2="134" y2="32" />
                <path d="M106 32 l-5 9 M106 32 l5 9 M134 32 l-5 9 M134 32 l5 9" />
            </g>
            <path d="M100 41 q6 6 12 0 Z M128 41 q6 6 12 0 Z" fill={C.gold} />
            {/* janelas */}
            <rect x="32" y="24" width="44" height="30" rx="3" fill={C.surf} stroke={C.border} />
            <rect x="164" y="24" width="44" height="30" rx="3" fill={C.surf} stroke={C.border} />
            <line x1="54" y1="24" x2="54" y2="54" stroke={C.border} /><line x1="186" y1="24" x2="186" y2="54" stroke={C.border} />
            {person(64, C.primary)}
            {person(120, C.p600)}
            {person(176, C.ink)}
            {/* mesa */}
            <rect x="34" y="110" width="172" height="12" rx="4" fill={C.wood} />
            <rect x="48" y="122" width="8" height="24" fill={C.woodDark} /><rect x="184" y="122" width="8" height="24" fill={C.woodDark} />
            <rect x="96" y="102" width="30" height="8" rx="2" fill={C.surf} stroke={C.border} />
            <rect x="140" y="103" width="22" height="7" rx="2" fill={C.gold} />
            <rect x="70" y="104" width="18" height="6" rx="2" fill={C.primary} />
        </svg>
    );
}

// Balança da justiça (marca d'água pequena para barras laterais e estados vazios)
export function ScalesMark({ className, style }) {
    return (
        <svg viewBox="0 0 120 100" className={className} style={style} aria-hidden="true" focusable="false">
            <circle cx="60" cy="50" r="46" fill={C.p50} />
            <g stroke={C.primary} strokeWidth="3" fill="none" strokeLinecap="round">
                <line x1="60" y1="20" x2="60" y2="78" />
                <line x1="32" y1="30" x2="88" y2="30" />
                <path d="M32 30 l-10 20 M32 30 l10 20 M88 30 l-10 20 M88 30 l10 20" />
                <line x1="44" y1="80" x2="76" y2="80" />
            </g>
            <path d="M20 50 q12 12 24 0 Z M76 50 q12 12 24 0 Z" fill={C.gold} />
            <circle cx="60" cy="20" r="4" fill={C.gold} />
        </svg>
    );
}
