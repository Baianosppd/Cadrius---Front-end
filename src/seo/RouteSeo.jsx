import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { seoFor } from './seo';

function setMeta(attr, key, content) {
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function setCanonical(href) {
    let el = document.head.querySelector('link[rel="canonical"]');
    if (!href) { el?.remove(); return; }
    if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', 'canonical');
        document.head.appendChild(el);
    }
    el.setAttribute('href', href);
}

// Atualiza <title>, descrição, canonical, robots e Open Graph a cada troca de rota.
export default function RouteSeo() {
    const { pathname } = useLocation();
    useEffect(() => {
        const seo = seoFor(pathname, window.location.hostname);
        document.title = seo.title;
        setMeta('name', 'description', seo.description);
        setMeta('name', 'robots', seo.robots);
        setMeta('property', 'og:title', seo.title);
        setMeta('property', 'og:description', seo.description);
        if (seo.canonical) setMeta('property', 'og:url', seo.canonical);
        setCanonical(seo.canonical);
    }, [pathname]);
    return null;
}
