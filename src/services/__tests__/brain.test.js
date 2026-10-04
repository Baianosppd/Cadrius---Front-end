import { describe, it, expect } from 'vitest';
import { pct, promotionProgress } from '../brain';

const criteria = { min_samples: 30, min_approval_rate: '0.95', window_days: 60 };

describe('brain', () => {
    it('formata percentuais', () => {
        expect(pct('0.9666')).toBe('97%');
        expect(pct(null)).toBe('0%');
    });

    it('mostra o progresso rumo à promoção de autonomia', () => {
        const base = { locked: false, samples: 15, approval_rate: '0.95', rejected: 0, undone: 0 };
        expect(promotionProgress(base, criteria)).toMatchObject({ volume: 0.5, quality: 1, ready: false, blocked: false });
        expect(promotionProgress({ ...base, samples: 30 }, criteria).ready).toBe(true);
        expect(promotionProgress({ ...base, samples: 30, undone: 1 }, criteria)).toMatchObject({ blocked: true, ready: false });
        expect(promotionProgress({ ...base, samples: 40, approval_rate: '0.80' }, criteria).ready).toBe(false);
        expect(promotionProgress({ ...base, locked: true }, criteria)).toBeNull();     // R4 nunca promove
        expect(promotionProgress({ ...base, samples: 0 }, criteria).quality).toBe(0);
    });
});
