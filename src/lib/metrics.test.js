import { describe, it, expect } from 'vitest';

export function calculateEngagementRate(likes, comments, shares, followers) {
  if (!followers || followers <= 0) return 0;
  const totalInteractions = (Number(likes) || 0) + (Number(comments) || 0) + (Number(shares) || 0);
  return Number(((totalInteractions / followers) * 100).toFixed(2));
}

export function formatMetricNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  const val = Number(num);
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
  if (val >= 1_000) return (val / 1_000).toFixed(1) + 'K';
  return val.toString();
}

describe('Calculs de Métriques (KPI & Engagement)', () => {
  it('devrait calculer le taux d\'engagement avec précision', () => {
    const rate = calculateEngagementRate(1000, 200, 50, 10000); // (1250 / 10000) * 100 = 12.5%
    expect(rate).toBe(12.5);
  });

  it('devrait retourner 0 si le nombre d\'abonnés est égal à 0 ou négatif', () => {
    expect(calculateEngagementRate(100, 50, 10, 0)).toBe(0);
    expect(calculateEngagementRate(100, 50, 10, -100)).toBe(0);
  });

  it('devrait formater correctement les grands nombres pour l\'UI KPI', () => {
    expect(formatMetricNumber(500)).toBe('500');
    expect(formatMetricNumber(1500)).toBe('1.5K');
    expect(formatMetricNumber(2500000)).toBe('2.5M');
    expect(formatMetricNumber(null)).toBe('0');
  });
});
