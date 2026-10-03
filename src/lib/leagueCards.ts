export function fastThreeCardSizes(total: number): number[] {
  if (total <= 0) return [];
  if (total < 3) return [total];
  if (total === 5) return [3, 2];
  const threes = Math.floor(total / 3);
  const remainder = total % 3;
  if (remainder === 0) return Array(threes).fill(3);
  if (remainder === 1) return [...Array(Math.max(0, threes - 1)).fill(3), 4];
  if (threes >= 2) return [...Array(threes - 2).fill(3), 4, 4];
  return [3, 2];
}

export function balancedCardSizes(total: number, target: number): number[] {
  if (total <= 0) return [];
  const count = Math.ceil(total / Math.min(4, target));
  const base = Math.floor(total / count);
  return Array.from({ length: count }, (_, i) => base + (i < total % count ? 1 : 0));
}

export function cardSizes(total: number, target: number): number[] {
  return target === 3 ? fastThreeCardSizes(total) : balancedCardSizes(total, target);
}

export function shotgunHoleOrder(firstHole: number): number[] {
  const start = Math.max(1, Math.min(18, firstHole || 1));
  const primary = Array.from({ length: 9 }, (_, index) => ((start - 1 + index * 2) % 18) + 1);
  const secondaryStart = (start % 18) + 1;
  const secondary = Array.from({ length: 9 }, (_, index) => ((secondaryStart - 1 + index * 2) % 18) + 1);
  return [...primary, ...secondary];
}
