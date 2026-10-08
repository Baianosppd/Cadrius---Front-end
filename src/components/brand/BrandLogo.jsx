import { useId } from 'react';
import s from './BrandLogo.module.css';

// Símbolo do Cadrius (CAD-233): o "C" envolve uma coluna clássica (o Direito e a base que sustenta o escritório).
// Azul profundo → azul do sistema; funciona nos temas claro e escuro. Mesmo desenho do favicon (public/favicon.svg).
export function BrandMark({ size = 28, className = '' }) {
    const id = `cadrius-g-${useId().replace(/:/g, '')}`;
    return (
        <svg className={`${s.mark} ${className}`} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
            <defs>
                <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#0a2463" />
                    <stop offset=".6" stopColor="#1d4ed8" />
                    <stop offset="1" stopColor="#3b82f6" />
                </linearGradient>
            </defs>
            <rect width="64" height="64" rx="15" fill={`url(#${id})`} />
            <path d="M46 20A17.5 17.5 0 1 0 46 44" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
            <g fill="#dbeafe">
                <path d="M23.5 22.5h17l-2 3.2h-13z" />
                <rect x="27" y="26.6" width="2.4" height="11" rx=".6" />
                <rect x="30.8" y="26.6" width="2.4" height="11" rx=".6" />
                <rect x="34.6" y="26.6" width="2.4" height="11" rx=".6" />
                <path d="M25 38.5h14l1.5 3h-17z" />
            </g>
        </svg>
    );
}

// Logotipo: símbolo + "Cadrius". tone="auto" segue o tema (texto na cor de título); tone="light" para fundos escuros.
export default function BrandLogo({ size = 28, tone = 'auto', badge, className = '', name = 'Cadrius' }) {
    return (
        <span className={`${s.logo} ${tone === 'light' ? s.light : ''} ${className}`} style={{ '--logo-size': `${size}px` }}>
            <BrandMark size={size} />
            <span className={s.name}>{name}</span>
            {badge && <span className={s.badge}>{badge}</span>}
        </span>
    );
}
